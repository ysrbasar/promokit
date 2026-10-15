import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionSecret, verifySession } from "./session";

/** Middleware'e ek olarak her yönetim API'sinde tekrar doğrulanır (derinlemesine savunma) */
export async function isAdmin(): Promise<boolean> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value, sessionSecret());
}

export async function requireAdminApi(): Promise<NextResponse | null> {
  return (await isAdmin()) ? null : NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
}

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD_HASH && !!sessionSecret();
}

/** Basit bellek içi deneme sınırlayıcı: IP başına 15 dakikada 5 hatalı giriş */
const attempts = new Map<string, { n: number; until: number }>();
export function loginBlocked(ip: string): boolean {
  const a = attempts.get(ip);
  return !!a && a.n >= 5 && a.until > Date.now();
}
export function recordFailure(ip: string) {
  const a = attempts.get(ip);
  const now = Date.now();
  if (!a || a.until < now) attempts.set(ip, { n: 1, until: now + 15 * 60 * 1000 });
  else a.n++;
}
export function clearFailures(ip: string) {
  attempts.delete(ip);
}
