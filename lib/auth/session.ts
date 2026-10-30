import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { COOKIE_SESSION } from "@/lib/quota/constants";

export type SessionPayload = {
  uid: string;
  email: string;
  exp: number; // unix seconds
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  // 本地未配置时用固定开发密钥（生产务必设置 SESSION_SECRET）
  if (process.env.NODE_ENV !== "production") {
    return "dev-only-session-secret-change-me";
  }
  throw new Error("缺少 SESSION_SECRET（至少 16 字符）");
}

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, "utf8");
  return b.toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createSessionToken(uid: string, email: string, days = 30): string {
  const payload: SessionPayload = {
    uid,
    email,
    exp: Math.floor(Date.now() / 1000) + days * 24 * 60 * 60,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.uid || !payload?.email || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function newUserId(): string {
  return randomUUID();
}

export function sessionCookieOptions(maxAgeSec = 30 * 24 * 60 * 60) {
  return {
    name: COOKIE_SESSION,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  };
}
