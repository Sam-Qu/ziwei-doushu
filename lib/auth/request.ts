import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import {
  COOKIE_GUEST,
  COOKIE_SESSION,
  GUEST_DAILY_LIMIT,
  MEMBER_DAILY_LIMIT,
} from "@/lib/quota/constants";
import { consumeQuota, peekQuota } from "@/lib/quota/store";
import { verifySessionToken } from "./session";

export type AuthSubject = {
  kind: "guest" | "member";
  id: string;
  email?: string;
  limit: number;
  subjectKey: string; // quota 计数键
};

export async function readSession(): Promise<{ uid: string; email: string } | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSION)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  return { uid: payload.uid, email: payload.email };
}

/** 确保游客 cookie 存在，返回 guest id */
export async function ensureGuestId(): Promise<{ id: string; setCookie: boolean }> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_GUEST)?.value;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
    return { id: existing, setCookie: false };
  }
  return { id: randomUUID(), setCookie: true };
}

export async function resolveSubject(): Promise<{
  subject: AuthSubject;
  guestId: string;
  setGuestCookie: boolean;
}> {
  const session = await readSession();
  const guest = await ensureGuestId();
  if (session) {
    return {
      subject: {
        kind: "member",
        id: session.uid,
        email: session.email,
        limit: MEMBER_DAILY_LIMIT,
        subjectKey: `u:${session.uid}`,
      },
      guestId: guest.id,
      setGuestCookie: guest.setCookie,
    };
  }
  return {
    subject: {
      kind: "guest",
      id: guest.id,
      limit: GUEST_DAILY_LIMIT,
      subjectKey: `g:${guest.id}`,
    },
    guestId: guest.id,
    setGuestCookie: guest.setCookie,
  };
}

export async function checkAndConsumeInterpretQuota() {
  const { subject, guestId, setGuestCookie } = await resolveSubject();
  const result = await consumeQuota(subject.subjectKey, subject.limit);
  const used = result.ok ? result.used : await peekQuota(subject.subjectKey);
  return {
    subject,
    guestId,
    setGuestCookie,
    allowed: result.ok,
    used: result.ok ? result.used : used,
    limit: subject.limit,
  };
}

export function guestCookieHeader(id: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  // 1 year
  return `${COOKIE_GUEST}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`;
}
