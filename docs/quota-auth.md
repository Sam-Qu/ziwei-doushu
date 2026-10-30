# 一期会员日限与微信扫码登录

## 规则

- 日界：`Asia/Shanghai` 自然日（全站统一）
- 游客（未登录）：每天 **2** 次完整 AI 解读（`POST /api/interpret`）
- 微信登录后的免费会员：每天 **20** 次
- 超额：HTTP `429`，`code` 为 `QUOTA_EXCEEDED_GUEST` / `QUOTA_EXCEEDED_MEMBER`
- 付费档：以后再做

## 登录方案：微信开放平台网站应用扫码

面向中国大陆、操作尽量简单：主按钮文案 **「微信扫码登录」**。

官方流程（`scope=snsapi_login`）：

1. 用户点登录 → `GET /api/auth/wechat/start` → 302 到  
   `https://open.weixin.qq.com/connect/qrconnect?...`
2. 手机微信扫码确认后，微信回调  
   `GET /api/auth/wechat/callback?code=...&state=...`
3. 服务端用 `code` 调  
   `https://api.weixin.qq.com/sns/oauth2/access_token` 换 `openid` / `unionid`
4. 写入会员记录 + 设置 HttpOnly 会话 Cookie `zw_session`，再跳回首页

游客 Cookie：`zw_guest`（匿名 UUID）。

存储：Upstash Redis REST；未配置时回退进程内 Map（**多实例不共享**）。

## 上线前提（必读）

微信网站应用扫码登录要求：

1. 在 [微信开放平台](https://open.weixin.qq.com/) 注册并创建 **网站应用**，通过审核并开通「微信登录」。
2. 获得 `AppID` / `AppSecret`，填入环境变量。
3. **授权回调域** 必须是已备案域名（ICP）。  
   - 本站备案号示例：蜀ICP备2026066138号  
   - **`*.vercel.app` 预览域名通常不能作为授权回调域**，请用已绑定 ICP 的正式域名。
4. `WECHAT_REDIRECT_URI`（或由 `NEXT_PUBLIC_SITE_URL` 推导）须为：  
   `https://你的备案域名/api/auth/wechat/callback`，且域名与开放平台配置一致。

未配置 `WECHAT_APP_ID` / `WECHAT_APP_SECRET` 时，点登录会提示尚未配置（`503 WECHAT_NOT_CONFIGURED`），不会伪造微信接口。

## 环境变量

| 变量 | 说明 |
|------|------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST Token |
| `SESSION_SECRET` | 会话签名，≥16 字符 |
| `WECHAT_APP_ID` | 开放平台网站应用 AppID |
| `WECHAT_APP_SECRET` | 开放平台网站应用 AppSecret |
| `WECHAT_REDIRECT_URI` | 可选；默认 `{NEXT_PUBLIC_SITE_URL}/api/auth/wechat/callback` |
| `NEXT_PUBLIC_SITE_URL` | 站点根 URL（生产用备案域名） |

## 验收

1. 清 Cookie，解读第 3 次应提示登录（游客上限 2）。
2. 配好微信与 Redis 后，点「微信扫码登录」→ 扫码 → 回站后 `GET /api/auth/me` 为 `kind: "member"`，上限 20。
3. `store` 在配好 Upstash 后应为 `"upstash"`。
