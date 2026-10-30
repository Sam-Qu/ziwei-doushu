import OpenAI from 'openai';

export function getMiniMax() {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error('缺少 MINIMAX_API_KEY，请在 .env.local 中配置');
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.MINIMAX_BASE_URL || 'https://api.minimax.cn/v1',
  });
}

export function getMiniMaxModel() {
  return process.env.MINIMAX_MODEL || 'MiniMax-M3.1-Flash';
}
