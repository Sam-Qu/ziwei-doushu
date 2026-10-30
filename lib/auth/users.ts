import { getStore } from "@/lib/quota/store";
import { hashPassword, verifyPassword } from "./password";
import { newUserId } from "./session";

export type UserRecord = {
  uid: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

function emailKey(email: string): string {
  return `user:email:${email.trim().toLowerCase()}`;
}

function uidKey(uid: string): string {
  return `user:uid:${uid}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function createUser(
  emailRaw: string,
  password: string
): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const email = normalizeEmail(emailRaw);
  if (!isValidEmail(email)) return { ok: false, error: "邮箱格式不对" };
  if (password.length < 6) return { ok: false, error: "密码至少 6 位" };

  const store = getStore();
  const existing = await store.getString(emailKey(email));
  if (existing) return { ok: false, error: "这个邮箱已经注册过了" };

  const user: UserRecord = {
    uid: newUserId(),
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  const json = JSON.stringify(user);
  // 先写 uid，再写 email 索引；email 已存在则视为冲突
  await store.set(uidKey(user.uid), json);
  const again = await store.getString(emailKey(email));
  if (again) {
    await store.del(uidKey(user.uid));
    return { ok: false, error: "这个邮箱已经注册过了" };
  }
  await store.set(emailKey(email), json);
  return { ok: true, user };
}

export async function authenticate(
  emailRaw: string,
  password: string
): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const email = normalizeEmail(emailRaw);
  const store = getStore();
  const raw = await store.getString(emailKey(email));
  if (!raw) return { ok: false, error: "邮箱或密码不对" };
  let user: UserRecord;
  try {
    user = JSON.parse(raw) as UserRecord;
  } catch {
    return { ok: false, error: "账号数据异常" };
  }
  if (!verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "邮箱或密码不对" };
  }
  return { ok: true, user };
}
