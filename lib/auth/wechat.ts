/**
 * 微信开放平台「网站应用」扫码登录（OAuth2 authorization_code）
 * 文档: https://developers.weixin.qq.com/doc/oplatform/developers/dev/auth/web.html
 */

export const COOKIE_WX_STATE = "zw_wx_state";

export function getWechatAppId(): string {
  const id = process.env.WECHAT_APP_ID?.trim();
  if (!id) throw new Error("未配置 WECHAT_APP_ID");
  return id;
}

export function getWechatAppSecret(): string {
  const s = process.env.WECHAT_APP_SECRET?.trim();
  if (!s) throw new Error("未配置 WECHAT_APP_SECRET");
  return s;
}

/** 授权回调完整 URL，须与开放平台「授权回调域」一致 */
export function getWechatRedirectUri(): string {
  const explicit = process.env.WECHAT_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!site) {
    throw new Error("未配置 WECHAT_REDIRECT_URI 或 NEXT_PUBLIC_SITE_URL");
  }
  return `${site}/api/auth/wechat/callback`;
}

export function isWechatConfigured(): boolean {
  return Boolean(process.env.WECHAT_APP_ID?.trim() && process.env.WECHAT_APP_SECRET?.trim());
}

/** 第一步：跳转微信扫码页 */
export function buildQrConnectUrl(state: string): string {
  const appid = getWechatAppId();
  const redirect_uri = encodeURIComponent(getWechatRedirectUri());
  return (
    "https://open.weixin.qq.com/connect/qrconnect" +
    `?appid=${encodeURIComponent(appid)}` +
    `&redirect_uri=${redirect_uri}` +
    "&response_type=code" +
    "&scope=snsapi_login" +
    `&state=${encodeURIComponent(state)}` +
    "#wechat_redirect"
  );
}

export type WechatTokenResult = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
};

export type WechatUserInfo = {
  openid: string;
  nickname?: string;
  headimgurl?: string;
  unionid?: string;
};

/** 第二步：code 换 access_token + openid */
export async function exchangeCodeForToken(code: string): Promise<WechatTokenResult> {
  const appid = getWechatAppId();
  const secret = getWechatAppSecret();
  const url =
    "https://api.weixin.qq.com/sns/oauth2/access_token" +
    `?appid=${encodeURIComponent(appid)}` +
    `&secret=${encodeURIComponent(secret)}` +
    `&code=${encodeURIComponent(code)}` +
    "&grant_type=authorization_code";

  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as WechatTokenResult & { errcode?: number; errmsg?: string };
  if (data.errcode || !data.access_token || !data.openid) {
    throw new Error(data.errmsg || `微信换票失败(${data.errcode ?? "unknown"})`);
  }
  return data;
}

/** 可选：拉取昵称头像（需已授权） */
export async function fetchWechatUserInfo(
  accessToken: string,
  openid: string
): Promise<WechatUserInfo | null> {
  const url =
    "https://api.weixin.qq.com/sns/userinfo" +
    `?access_token=${encodeURIComponent(accessToken)}` +
    `&openid=${encodeURIComponent(openid)}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as WechatUserInfo & { errcode?: number };
    if (data.errcode || !data.openid) return null;
    return data;
  } catch {
    return null;
  }
}

export function stateCookieOptions(maxAgeSec = 600) {
  return {
    name: COOKIE_WX_STATE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  };
}
