import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { RUNTIME_DIR, readBytes } from "@/lib/server/storage";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", pdf: "application/pdf" };

/** Yüklenen dosyalar yalnızca yöneticiye, indirme olarak sunulur (SVG tarayıcıda çalıştırılmaz) */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { name } = await params;
  const m = name.match(/^(T-\d{8}-[A-Z0-9]{6})\.(png|jpg|svg|pdf)$/);
  if (!m) return NextResponse.json({ error: "Geçersiz dosya" }, { status: 400 });
  const buf = await readBytes(path.join(RUNTIME_DIR, "uploads", name)).catch(() => null);
  if (!buf) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return new NextResponse(buf as Uint8Array<ArrayBuffer>, {
      headers: {
      "Content-Type": TYPES[m[2]],
      "Content-Disposition": `attachment; filename="${name}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
