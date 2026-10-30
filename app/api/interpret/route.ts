import { NextRequest } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { getMiniMax, getMiniMaxModel } from '@/lib/ai/minimax';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/ai/prompt';
import {
  checkAndConsumeInterpretQuota,
  guestCookieHeader,
} from '@/lib/auth/request';

export const runtime = 'nodejs';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

function sseLine(payload: string): Uint8Array {
  return new TextEncoder().encode(`data: ${payload}\n\n`);
}

function jsonError(
  status: number,
  body: Record<string, unknown>,
  extraHeaders?: Record<string, string>
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders ?? {}),
    },
  });
}

export async function POST(req: NextRequest) {
  // ── 日限：游客 2 / 登录会员 20（Asia/Shanghai 自然日）──
  let quota;
  try {
    quota = await checkAndConsumeInterpretQuota();
  } catch (e) {
    const msg = e instanceof Error ? e.message : '额度服务异常';
    return jsonError(503, {
      error: msg,
      code: 'QUOTA_STORE_UNAVAILABLE',
    });
  }

  const guestHeaders: Record<string, string> = {};
  if (quota.setGuestCookie) {
    guestHeaders['Set-Cookie'] = guestCookieHeader(quota.guestId);
  }

  if (!quota.allowed) {
    const guest = quota.subject.kind === 'guest';
    return jsonError(
      429,
      {
        error: guest
          ? `今天免费解读已用完（${quota.limit} 次）。微信登录后每天可解读 20 次。`
          : `今天解读次数已用完（${quota.limit} 次），明天再来。`,
        code: guest ? 'QUOTA_EXCEEDED_GUEST' : 'QUOTA_EXCEEDED_MEMBER',
        kind: quota.subject.kind,
        limit: quota.limit,
        used: quota.used,
        remaining: 0,
      },
      guestHeaders
    );
  }

  let body: {
    chart?: ZiweiChart;
    messages?: ChatTurn[];
    focus?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return jsonError(400, { error: '无效的 JSON 请求体' }, guestHeaders);
  }

  const chart = body.chart;
  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (!chart || typeof chart !== 'object' || !Array.isArray(chart.palaces)) {
    return jsonError(400, { error: '缺少有效的 chart 字段' }, guestHeaders);
  }

  if (messages.length === 0) {
    return jsonError(400, { error: '缺少 messages' }, guestHeaders);
  }

  let client;
  try {
    client = getMiniMax();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI 配置错误';
    return jsonError(500, { error: msg }, guestHeaders);
  }

  const model = getMiniMaxModel();
  const userContent = buildUserMessage(chart, messages, body.focus);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // MiniMax-M3.1-Flash 默认 reasoning_effort=max，思考 token 也计入上限。
        // 旧版 max_tokens:2048 常被推理耗尽 → content 为空、前端只见「解读结果为空」。
        const completion = await (client.chat.completions.create as any)({
          model,
          stream: true,
          max_completion_tokens: 8192,
          reasoning_effort: 'low',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent },
          ],
        });

        let emitted = 0;
        let finishReason: string | null = null;
        for await (const chunk of completion) {
          const choice = chunk.choices?.[0];
          if (choice?.finish_reason) finishReason = choice.finish_reason;
          const text = choice?.delta?.content ?? '';
          if (!text) continue;
          emitted += text.length;
          controller.enqueue(
            sseLine(JSON.stringify({ delta: { text } }))
          );
        }

        if (emitted === 0) {
          const hint =
            finishReason === 'length'
              ? '模型在思考阶段用尽了长度上限，正文未生成。请再点一次主题重试。'
              : '模型未返回正文。请再点一次主题或宫位重试。';
          controller.enqueue(
            sseLine(JSON.stringify({ delta: { text: hint } }))
          );
        }

        controller.enqueue(sseLine('[DONE]'));
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : '解读失败';
        // 已开始流式时只能往流里写错误提示；前端会拼进 assistant 气泡
        try {
          controller.enqueue(
            sseLine(JSON.stringify({ delta: { text: `\n\n（解读中断：${msg}）` } }))
          );
          controller.enqueue(sseLine('[DONE]'));
        } catch {
          /* ignore */
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Quota-Limit': String(quota.limit),
      'X-Quota-Used': String(quota.used),
      'X-Quota-Remaining': String(Math.max(0, quota.limit - quota.used)),
      'X-Quota-Kind': quota.subject.kind,
      ...guestHeaders,
    },
  });
}
