/** User-visible AI failures must not name a vendor, model, or secret. */
const VENDOR =
  /minimax|anthropic|claude|openai|deepseek|gpt-?\d|mimo|moonshot|qwen|gemini|m3\.1|api[_\s-]?key|sk-|minimax\.cn/i;

export function scrubVendorText(raw: string, fallback: string): string {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text || VENDOR.test(text)) return fallback;
  return text;
}
