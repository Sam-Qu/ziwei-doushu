import { NextResponse } from "next/server";
import { resolveSubject, guestCookieHeader } from "@/lib/auth/request";
import { peekQuota, getStore } from "@/lib/quota/store";
import { GUEST_DAILY_LIMIT, MEMBER_DAILY_LIMIT } from "@/lib/quota/constants";
import { shanghaiDayKey } from "@/lib/quota/day";
import { isWechatConfigured } from "@/lib/auth/wechat";

export const runtime = "nodejs";

export async function GET() {
  const { subject, guestId, setGuestCookie } = await resolveSubject();
  const used = await peekQuota(subject.subjectKey);
  const res = NextResponse.json({
    kind: subject.kind,
    nickname: subject.nickname ?? null,
    limit: subject.limit,
    used,
    remaining: Math.max(0, subject.limit - used),
    day: shanghaiDayKey(),
    store: getStore().kind,
    wechatConfigured: isWechatConfigured(),
    limits: { guest: GUEST_DAILY_LIMIT, member: MEMBER_DAILY_LIMIT },
  });
  if (setGuestCookie) {
    res.headers.append("Set-Cookie", guestCookieHeader(guestId));
  }
  return res;
}
