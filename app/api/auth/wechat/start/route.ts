import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  buildQrConnectUrl,
  isWechatConfigured,
  stateCookieOptions,
} from "@/lib/auth/wechat";

export const runtime = "nodejs";

/**
 * 发起微信网站应用扫码登录：写入 state Cookie 后 302 到微信 qrconnect。
 * GET /api/auth/wechat/start
 */
export async function GET() {
  if (!isWechatConfigured()) {
    return NextResponse.json(
      {
        error: "尚未配置微信登录（需要 WECHAT_APP_ID / WECHAT_APP_SECRET）",
        code: "WECHAT_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  try {
    const state = randomBytes(16).toString("hex");
    const url = buildQrConnectUrl(state);
    const res = NextResponse.redirect(url, 302);
    const opts = stateCookieOptions();
    res.cookies.set(opts.name, state, opts);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "无法发起微信登录";
    return NextResponse.json({ error: msg, code: "WECHAT_START_FAILED" }, { status: 500 });
  }
}
