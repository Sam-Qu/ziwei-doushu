import OpenAI from 'openai';

export function getMiniMax() {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error('解读服务尚未配置，请稍后再试。');
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.MINIMAX_BASE_URL || 'https://api.minimax.cn/v1',
  });
}

export function getMiniMaxModel() {
  return process.env.MINIMAX_MODEL || 'MiniMax-M3.1-Flash';
}
