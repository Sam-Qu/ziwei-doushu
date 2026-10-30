import { NextResponse } from "next/server";
import { resolveSubject } from "@/lib/auth/request";
import { peekQuota } from "@/lib/quota/store";
import { guestCookieHeader } from "@/lib/auth/request";
import { GUEST_DAILY_LIMIT, MEMBER_DAILY_LIMIT } from "@/lib/quota/constants";
import { getStore } from "@/lib/quota/store";
import { shanghaiDayKey } from "@/lib/quota/day";

export const runtime = "nodejs";

export async function GET() {
  const { subject, guestId, setGuestCookie } = await resolveSubject();
  const used = await peekQuota(subject.subjectKey);
  const res = NextResponse.json({
    kind: subject.kind,
    email: subject.email ?? null,
    limit: subject.limit,
    used,
    remaining: Math.max(0, subject.limit - used),
    day: shanghaiDayKey(),
    store: getStore().kind,
    limits: { guest: GUEST_DAILY_LIMIT, member: MEMBER_DAILY_LIMIT },
  });
  if (setGuestCookie) {
    res.headers.append("Set-Cookie", guestCookieHeader(guestId));
  }
  return res;
}
