'use client';

import { useCallback, useEffect, useState } from "react";

type Me = {
  kind: "guest" | "member";
  email: string | null;
  limit: number;
  used: number;
  remaining: number;
};

type Mode = "login" | "register";

export default function AuthButton() {
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as Me;
      setMe(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "失败了，请重试");
        return;
      }
      setOpen(false);
      setPassword("");
      await refresh();
    } catch {
      setError("网络异常，请重试");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await refresh();
  };

  const isMember = me?.kind === "member";

  return (
    <>
      <div className="flex items-center gap-2">
        {me && (
          <span className="hidden sm:inline text-[10px]" style={{ color: "#6b6b63" }}>
            今日剩 {me.remaining}/{me.limit}
          </span>
        )}
        {isMember ? (
          <button
            type="button"
            onClick={logout}
            className="text-xs px-3 py-1.5 rounded-full border"
            style={{
              borderColor: "rgba(212,168,67,0.3)",
              color: "rgba(212,180,100,0.9)",
              background: "rgba(255,255,255,0.05)",
            }}
            title={me?.email ?? ""}
          >
            退出
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setOpen(true);
              setError("");
            }}
            className="text-xs px-3 py-1.5 rounded-full border"
            style={{
              borderColor: "rgba(212,168,67,0.45)",
              color: "#b8922a",
              background: "rgba(212,168,67,0.12)",
            }}
          >
            登录
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 shadow-xl"
            style={{ background: "#fffaf0", border: "1px solid #e5e2d9" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-1" style={{ color: "#0d0d0b" }}>
              {mode === "login" ? "登录" : "注册免费会员"}
            </h2>
            <p className="text-[12px] mb-4" style={{ color: "#6b6b63" }}>
              游客每天 2 次解读；登录后每天 20 次。
            </p>

            <label className="block text-[12px] mb-1" style={{ color: "#3a3a35" }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-3 rounded-lg px-3 py-2 text-sm"
              style={{ border: "1px solid #e5e2d9", background: "#fff", color: "#0d0d0b" }}
              placeholder="你的邮箱"
              autoComplete="email"
            />

            <label className="block text-[12px] mb-1" style={{ color: "#3a3a35" }}>
              密码（至少 6 位）
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-3 rounded-lg px-3 py-2 text-sm"
              style={{ border: "1px solid #e5e2d9", background: "#fff", color: "#0d0d0b" }}
              placeholder="密码"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />

            {error && (
              <p className="text-[12px] mb-3" style={{ color: "#b42318" }}>
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={busy || !email.trim() || password.length < 6}
              onClick={submit}
              className="w-full py-2.5 rounded-full text-sm font-semibold disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg,#b8892a,#f0d070,#b8892a)",
                color: "#08080a",
              }}
            >
              {busy ? "请稍候…" : mode === "login" ? "登录" : "注册并登录"}
            </button>

            <button
              type="button"
              className="w-full mt-3 text-[12px]"
              style={{ color: "#6b6b63" }}
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "没有账号？点这里注册" : "已有账号？点这里登录"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
