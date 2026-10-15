import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { RUNTIME_DIR } from "@/lib/server/jsonStore";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", pdf: "application/pdf" };

/** Yüklenen dosyalar yalnızca yöneticiye, indirme olarak sunulur (SVG tarayıcıda çalıştırılmaz) */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { name } = await params;
  const m = name.match(/^(T-\d{8}-[A-Z0-9]{6})\.(png|jpg|svg|pdf)$/);
  if (!m) return NextResponse.json({ error: "Geçersiz dosya" }, { status: 400 });
  try {
    const buf = await readFile(path.join(RUNTIME_DIR, "uploads", name));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": TYPES[m[2]],
        "Content-Disposition": `attachment; filename="${name}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
