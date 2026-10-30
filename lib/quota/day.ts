import { QUOTA_TZ } from "./constants";

/** 返回 Asia/Shanghai 的 YYYY-MM-DD */
export function shanghaiDayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: QUOTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * 距上海时区当日结束的秒数。
 * 上海日 D 结束于次日 00:00 CST = 当日 16:00 UTC。
 */
export function secondsUntilShanghaiDayEnd(date = new Date()): number {
  const day = shanghaiDayKey(date);
  const endMs = Date.parse(`${day}T16:00:00.000Z`);
  const secs = Math.floor((endMs - date.getTime()) / 1000);
  return Math.max(60, secs);
}
