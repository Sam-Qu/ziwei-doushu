import { Redis } from "@upstash/redis";
import { secondsUntilShanghaiDayEnd, shanghaiDayKey } from "./day";

type Store = {
  incr(key: string, ttlSeconds: number): Promise<number>;
  decr(key: string): Promise<number>;
  get(key: string): Promise<number>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  getString(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
  kind: "upstash" | "memory";
};

const g = globalThis as unknown as { __zwMem?: Map<string, { v: string; exp?: number }> };

function memoryStore(): Store {
  if (!g.__zwMem) g.__zwMem = new Map();
  const mem = g.__zwMem;

  const read = (key: string): string | null => {
    const row = mem.get(key);
    if (!row) return null;
    if (row.exp && Date.now() > row.exp) {
      mem.delete(key);
      return null;
    }
    return row.v;
  };

  return {
    kind: "memory",
    async incr(key, ttlSeconds) {
      const cur = Number(read(key) ?? "0") + 1;
      const prev = mem.get(key);
      const exp = prev?.exp ?? Date.now() + ttlSeconds * 1000;
      mem.set(key, { v: String(cur), exp });
      return cur;
    },
    async decr(key) {
      const cur = Math.max(0, Number(read(key) ?? "0") - 1);
      const prev = mem.get(key);
      mem.set(key, { v: String(cur), exp: prev?.exp });
      return cur;
    },
    async get(key) {
      return Number(read(key) ?? "0");
    },
    async set(key, value, ttlSeconds) {
      mem.set(key, {
        v: value,
        exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      });
    },
    async getString(key) {
      return read(key);
    },
    async del(key) {
      mem.delete(key);
    },
  };
}

function upstashStore(): Store | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return {
    kind: "upstash",
    async incr(key, ttlSeconds) {
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, ttlSeconds);
      return n;
    },
    async decr(key) {
      return redis.decr(key);
    },
    async get(key) {
      const v = await redis.get<string | number>(key);
      return Number(v ?? 0);
    },
    async set(key, value, ttlSeconds) {
      if (ttlSeconds) await redis.set(key, value, { ex: ttlSeconds });
      else await redis.set(key, value);
    },
    async getString(key) {
      const v = await redis.get<string>(key);
      return v ?? null;
    },
    async del(key) {
      await redis.del(key);
    },
  };
}

let cached: Store | null = null;

/** Upstash REST 优先；未配置时用进程内 Map（多实例不共享，仅本地/临时） */
export function getStore(): Store {
  if (cached) return cached;
  cached = upstashStore() ?? memoryStore();
  return cached;
}

export function quotaKey(subject: string, day = shanghaiDayKey()): string {
  return `quota:${day}:${subject}`;
}

export async function consumeQuota(
  subject: string,
  limit: number
): Promise<{ ok: true; used: number; limit: number } | { ok: false; used: number; limit: number }> {
  const store = getStore();
  const key = quotaKey(subject);
  const ttl = secondsUntilShanghaiDayEnd();
  const used = await store.incr(key, ttl);
  if (used > limit) {
    await store.decr(key);
    return { ok: false, used: limit, limit };
  }
  return { ok: true, used, limit };
}

export async function peekQuota(subject: string): Promise<number> {
  return getStore().get(quotaKey(subject));
}
