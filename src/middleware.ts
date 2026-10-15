import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionSecret, verifySession } from "./lib/auth/session";

/** /admin ve /api/admin rotalarını sunucu tarafında korur. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/giris" || pathname === "/api/admin/login") return NextResponse.next();

  const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value, sessionSecret());
  if (ok) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/giris";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
