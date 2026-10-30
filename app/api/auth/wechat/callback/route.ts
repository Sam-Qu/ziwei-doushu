import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_WX_STATE,
  exchangeCodeForToken,
  fetchWechatUserInfo,
  getWechatRedirectUri,
} from "@/lib/auth/wechat";
import { upsertWechatUser } from "@/lib/auth/users";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";

function siteHome(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "/").replace(/\/$/, "") || "/";
}

function failRedirect(message: string): NextResponse {
  const home = siteHome();
  const url = new URL(home.startsWith("http") ? home : "http://localhost:3000");
  url.searchParams.set("login_error", message);
  return NextResponse.redirect(url.toString(), 302);
}

/**
 * 微信授权回调：校验 state → code 换 openid → 建会话 → 回首页。
 * GET /api/auth/wechat/callback?code=&state=
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get(COOKIE_WX_STATE)?.value;

  if (!code) {
    return failRedirect("微信登录未完成");
  }
  if (!state || !expected || state !== expected) {
    return failRedirect("登录状态校验失败，请重试");
  }

  try {
    // 确认回调 URL 可解析（缺配置时提前报错）
    getWechatRedirectUri();

    const token = await exchangeCodeForToken(code);
    const profile = await fetchWechatUserInfo(token.access_token, token.openid);
    const user = await upsertWechatUser({
      openid: token.openid,
      unionid: token.unionid || profile?.unionid,
      nickname: profile?.nickname,
      headimgurl: profile?.headimgurl,
    });

    const session = createSessionToken({
      uid: user.uid,
      openid: user.openid,
      unionid: user.unionid,
      nickname: user.nickname,
    });

    const home = siteHome();
    const dest = home.startsWith("http") ? home : "http://localhost:3000";
    const res = NextResponse.redirect(dest, 302);
    const sessOpts = sessionCookieOptions();
    res.cookies.set(sessOpts.name, session, sessOpts);
    // 清掉 state
    res.cookies.set(COOKIE_WX_STATE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "微信登录失败";
    return failRedirect(msg);
  }
}
