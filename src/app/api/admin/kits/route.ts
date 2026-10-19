import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { ReadyKitsFile } from "@/lib/kit/readyKits";
import { getCatalog, restoreKit, saveReadyKits } from "@/lib/server/repositories";

export async function PUT(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const parsed = ReadyKitsFile.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).slice(0, 5).join("; ") }, { status: 422 });
  }
  const slugs = parsed.data.kits.map((k) => k.slug);
  if (new Set(slugs).size !== slugs.length) return NextResponse.json({ error: "Kit adresleri (slug) benzersiz olmalı" }, { status: 422 });
  const { products } = await getCatalog();
  const known = new Set(products.map((p) => p.productCode));
  const unknown = parsed.data.kits.flatMap((k) => k.items.map((i) => i.productCode)).filter((c) => !known.has(c));
  await saveReadyKits(parsed.data.kits);
  return NextResponse.json({ ok: true, warnings: unknown.length ? [`Katalogda olmayan kodlar kural motoruyla tamamlanacak: ${[...new Set(unknown)].join(", ")}`] : [] });
}

/** Gizlenen bir otomatik kiti geri getirir: { restore: "slug" } */
export async function PATCH(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { restore?: unknown } | null;
  if (typeof body?.restore !== "string" || !body.restore) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  await restoreKit(body.restore);
  return NextResponse.json({ ok: true });
}
