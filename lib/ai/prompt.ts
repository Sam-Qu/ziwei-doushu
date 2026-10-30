import type { ZiweiChart } from '@/lib/ziwei/types';

export const SYSTEM_PROMPT = `你是紫微斗数解读助手，熟悉倪海厦《天纪》体系口径。
只根据用户给出的命盘结构与对话问题作说明。
要求：
- 语气克制、条理清晰，可用小标题分段
- 标明内容仅供参考与学习，不承诺吉凶结果，不鼓励迷信决策
- 命理专名可保留中文（紫微、天机、四化等）
- 不要编造盘中不存在的主星、宫位或四化
- 若信息不足，明确说明并给出基于现有结构的保守解读`;

/** 把命盘 JSON 压成模型易读的摘要，避免整盘超长 */
export function summarizeChart(chart: ZiweiChart): string {
  const { birthInfo, lunarInfo, palaces, daXians, currentAge, currentDaXianIndex } = chart;
  const gender = birthInfo?.gender === 'male' ? '男' : birthInfo?.gender === 'female' ? '女' : '未知';
  const pillars = lunarInfo?.fourPillars?.join(' ') ?? '未知';
  const palaceLines = palaces.map((p) => {
    const flags = [
      p.isMingGong ? '命' : '',
      p.isShenGong ? '身' : '',
      p.isCurrentDaXian ? '限' : '',
    ]
      .filter(Boolean)
      .join('/');
    const stars = p.stars
      .map((s) => {
        const si = s.siHua ? `化${s.siHua}` : '';
        const br = s.brightnessRaw ? `(${s.brightnessRaw})` : '';
        return `${s.name}${si}${br}`;
      })
      .join('、');
    const self =
      p.selfSihua && p.selfSihua.length
        ? ` 自化:${p.selfSihua.map((m) => `${m.starName}化${m.siHua}`).join(',')}`
        : '';
    return `- ${p.name}${flags ? `[${flags}]` : ''} 支${p.branch}: ${stars || '（空）'}${self}`;
  });

  const dx = daXians[currentDaXianIndex];
  const dxLine = dx
    ? `当前大限：${dx.palaceName} ${dx.startAge}-${dx.endAge}岁` +
      (dx.siHua
        ? ` 四化禄${dx.siHua.lu}/权${dx.siHua.quan}/科${dx.siHua.ke}/忌${dx.siHua.ji}`
        : '')
    : '当前大限：未知';

  return [
    `性别：${gender}${chart.yinYangGender ? `（${chart.yinYangGender}）` : ''}`,
    `公历：${birthInfo.year}-${birthInfo.month}-${birthInfo.day} 时辰支索引${birthInfo.hour}`,
    `农历：${lunarInfo.lunarYear}年${lunarInfo.isLeapMonth ? '闰' : ''}${Math.abs(lunarInfo.lunarMonth)}月${lunarInfo.lunarDay}日`,
    `四柱：${pillars}`,
    `五行局：${chart.wuxingJuName}`,
    `命主：${chart.mingZhu ?? '—'} 身主：${chart.shenZhu ?? '—'}`,
    `当前年龄：${currentAge}`,
    dxLine,
    '十二宫：',
    ...palaceLines,
  ].join('\n');
}

export function buildUserMessage(
  chart: ZiweiChart,
  messages: { role: 'user' | 'assistant'; content: string }[],
  focus?: unknown
): string {
  const history = messages
    .map((m) => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`)
    .join('\n\n');
  const focusBlock =
    focus === undefined || focus === null || focus === ''
      ? ''
      : `\n\n本次侧重：${typeof focus === 'string' ? focus : JSON.stringify(focus)}`;

  return `以下是命盘摘要（请严格据此解读）：\n${summarizeChart(chart)}${focusBlock}\n\n对话：\n${history}\n\n请针对最后一条用户问题作简明解读。`;
}
