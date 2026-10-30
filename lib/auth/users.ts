import { getStore } from "@/lib/quota/store";
import { newUserId } from "./session";

export type UserRecord = {
  uid: string;
  openid: string;
  unionid?: string;
  nickname?: string;
  headimgurl?: string;
  createdAt: string;
  updatedAt: string;
};

function openidKey(openid: string): string {
  return `user:wx:openid:${openid}`;
}

function unionidKey(unionid: string): string {
  return `user:wx:unionid:${unionid}`;
}

function uidKey(uid: string): string {
  return `user:uid:${uid}`;
}

/** 用微信 openid/unionid 创建或更新会员 */
export async function upsertWechatUser(input: {
  openid: string;
  unionid?: string;
  nickname?: string;
  headimgurl?: string;
}): Promise<UserRecord> {
  const store = getStore();
  const now = new Date().toISOString();

  let existingRaw: string | null = null;
  if (input.unionid) {
    existingRaw = await store.getString(unionidKey(input.unionid));
  }
  if (!existingRaw) {
    existingRaw = await store.getString(openidKey(input.openid));
  }

  let user: UserRecord;
  if (existingRaw) {
    try {
      user = JSON.parse(existingRaw) as UserRecord;
    } catch {
      user = {
        uid: newUserId(),
        openid: input.openid,
        createdAt: now,
        updatedAt: now,
      };
    }
    user.openid = input.openid;
    if (input.unionid) user.unionid = input.unionid;
    if (input.nickname) user.nickname = input.nickname;
    if (input.headimgurl) user.headimgurl = input.headimgurl;
    user.updatedAt = now;
  } else {
    user = {
      uid: newUserId(),
      openid: input.openid,
      unionid: input.unionid,
      nickname: input.nickname,
      headimgurl: input.headimgurl,
      createdAt: now,
      updatedAt: now,
    };
  }

  const json = JSON.stringify(user);
  await store.set(uidKey(user.uid), json);
  await store.set(openidKey(user.openid), json);
  if (user.unionid) await store.set(unionidKey(user.unionid), json);
  return user;
}
