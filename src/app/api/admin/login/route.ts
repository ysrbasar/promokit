import { NextResponse } from "next/server";
import { adminConfigured, clearFailures, loginBlocked, recordFailure } from "@/lib/auth/admin";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, sessionSecret, signSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Yönetici girişi yapılandırılmadı (ADMIN_PASSWORD_HASH ve ADMIN_SESSION_SECRET)." }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (loginBlocked(ip)) return NextResponse.json({ error: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!(await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH))) {
    recordFailure(ip);
    return NextResponse.json({ error: "Parola hatalı." }, { status: 401 });
  }
  clearFailures(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(sessionSecret()!), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
