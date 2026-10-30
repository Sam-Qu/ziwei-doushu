# MiniMax AI 解读（网页版）

开源仓库原本**不含** `/api/interpret`。本目录旁的实现用 MiniMax（OpenAI 兼容）补上了流式解读，对接 `InsightPanel` / `ChatPanel` 现有前端。

## 本地运行

1. 复制环境变量并填入密钥（不要提交 `.env.local`）：

```bash
cp .env.example .env.local
# 编辑 .env.local，至少填：
# MINIMAX_API_KEY=你的密钥
# MINIMAX_BASE_URL=https://api.minimax.cn/v1
# MINIMAX_MODEL=MiniMax-M3.1-Flash
```

2. 安装依赖并启动：

```bash
npm install
npm run dev
```

3. 打开排盘页（如 `/chart` 或首页排盘），生成命盘后点主题按钮或输入问题做 AI 解读。

## 接口约定（与前端一致）

- `POST /api/interpret`
- Body: `{ chart: ZiweiChart, messages: { role, content }[], focus?: unknown }`
- Response: SSE  
  - `data: {"delta":{"text":"..."}}`  
  - 结束：`data: [DONE]`
- 路由不存在时前端会显示「开源版不含 AI 解读接口」；实现后 404 提示会消失。

## 部署注意

密钥只放服务器环境变量（如 Vercel），不要使用 `NEXT_PUBLIC_*`，不要写进小程序或网页前端。
