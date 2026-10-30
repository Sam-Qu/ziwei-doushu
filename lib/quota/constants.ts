/** 一期会员日限（按 Asia/Shanghai 自然日） */
export const GUEST_DAILY_LIMIT = 2;
export const MEMBER_DAILY_LIMIT = 20;
export const QUOTA_TZ = "Asia/Shanghai";

export const COOKIE_GUEST = "zw_guest";
export const COOKIE_SESSION = "zw_session";

export type QuotaCode =
  | "QUOTA_EXCEEDED_GUEST"
  | "QUOTA_EXCEEDED_MEMBER"
  | "QUOTA_STORE_UNAVAILABLE";
