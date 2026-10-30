import { NextResponse } from "next/server";
import { resolveSubject, guestCookieHeader } from "@/lib/auth/request";
import { peekQuota, getStore } from "@/lib/quota/store";
import { shanghaiDayKey } from "@/lib/quota/day";

export const runtime = "nodejs";

export async function GET() {
  const { subject, guestId, setGuestCookie } = await resolveSubject();
  const used = await peekQuota(subject.subjectKey);
  const res = NextResponse.json({
    kind: subject.kind,
    limit: subject.limit,
    used,
    remaining: Math.max(0, subject.limit - used),
    day: shanghaiDayKey(),
    store: getStore().kind,
  });
  if (setGuestCookie) {
    res.headers.append("Set-Cookie", guestCookieHeader(guestId));
  }
  return res;
}
