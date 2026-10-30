import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/users";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }
  const result = await authenticate(body.email ?? "", body.password ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  const token = createSessionToken(result.user.uid, result.user.email);
  const res = NextResponse.json({
    ok: true,
    user: { email: result.user.email, uid: result.user.uid },
  });
  const opts = sessionCookieOptions();
  res.cookies.set(opts.name, token, opts);
  return res;
}
