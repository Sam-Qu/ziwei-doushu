'use client';

import { useCallback, useEffect, useState } from "react";

type Me = {
  kind: "guest" | "member";
  nickname: string | null;
  limit: number;
  used: number;
  remaining: number;
  wechatConfigured?: boolean;
};

export default function AuthButton() {
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return;
      setMe((await res.json()) as Me);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    try {
      const q = new URLSearchParams(window.location.search);
      const err = q.get("login_error");
      if (err) {
        setError(err);
        setOpen(true);
        q.delete("login_error");
        const url = window.location.pathname + (q.toString() ? `?${q}` : "");
        window.history.replaceState({}, "", url);
      }
    } catch {
      /* ignore */
    }
  }, [refresh]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await refresh();
  };

  const startWechat = () => {
    // 整页跳转到服务端发起的微信扫码页（官方 qrconnect）
    window.location.href = "/api/auth/wechat/start";
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
            title={me?.nickname || "已登录"}
          >
            {me?.nickname ? `退出 · ${me.nickname.slice(0, 6)}` : "退出"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setError("");
            }}
            className="text-xs px-3 py-1.5 rounded-full border"
            style={{
              borderColor: "rgba(7,193,96,0.5)",
              color: "#07c160",
              background: "rgba(7,193,96,0.12)",
            }}
          >
            登录
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-xl text-center"
            style={{ background: "#fffaf0", border: "1px solid #e5e2d9" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-2xl font-bold mb-2" style={{ color: "#0d0d0b" }}>
              微信扫码登录
            </p>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "#6b6b63" }}>
              游客每天只能解读 2 次
              <br />
              登录后每天可解读 20 次
            </p>

            {error && (
              <p className="text-sm mb-4" style={{ color: "#b42318" }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={startWechat}
              className="w-full py-4 rounded-full text-lg font-bold tracking-wide"
              style={{ background: "#07c160", color: "#fff" }}
            >
              微信扫码登录
            </button>

            <p className="text-xs mt-4" style={{ color: "#9a9a90" }}>
              用手机微信扫一扫即可
            </p>

            <button
              type="button"
              className="mt-4 text-sm"
              style={{ color: "#6b6b63" }}
              onClick={() => setOpen(false)}
            >
              先不登录
            </button>
          </div>
        </div>
      )}
    </>
  );
}
