# 一期会员日限与登录

## 规则

- 日界：`Asia/Shanghai` 自然日（与用户所在时区无关，全站统一）
- 游客（未登录）：每天 **2** 次完整 AI 解读（`POST /api/interpret`）
- 已登录免费会员：每天 **20** 次
- 超额：HTTP `429`，JSON `code` 为 `QUOTA_EXCEEDED_GUEST` 或 `QUOTA_EXCEEDED_MEMBER`
- 付费档：以后再做

## 方案

| 部分 | 选型 | 说明 |
|------|------|------|
| 登录 | 自建邮箱+密码 + HMAC 会话 Cookie | 无 Clerk/NextAuth，改动小、可上 Vercel |
| 存储 | Upstash Redis REST（`@upstash/redis`） | 无配置时回退进程内 Map（**多实例不共享**，仅本地/临时） |

Cookie：

- `zw_guest`：匿名游客 id（HttpOnly）
- `zw_session`：登录会话（HttpOnly，`SESSION_SECRET` 签名）

## 环境变量

见 `.env.example`：

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SESSION_SECRET`（≥16 字符，生产必填）

本地不配 Redis 也能跑（memory），但额度与账号不能跨进程/多实例共享。

## 验收

1. 清 Cookie，打开首页排盘 → 自动解读算 1 次；再点主题到第 3 次应提示登录（游客上限 2）。
2. 右上角「登录」注册账号后再解读，上限变为 20；`GET /api/auth/me` 可见 `kind: member`、`remaining`。
3. 配好 Upstash 后，`/api/auth/me` 的 `store` 应为 `upstash`。
