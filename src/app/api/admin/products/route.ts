import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { CATEGORIES } from "@/lib/config/taxonomy";
import { getCatalog, setOverride } from "@/lib/server/repositories";

const Body = z.object({
  productCode: z.string().min(1),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  category: z.enum(CATEGORIES.map((c) => c.key) as [string, ...string[]]).optional(),
});

export async function PATCH(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  const { productCode, ...patch } = parsed.data;
  const { products } = await getCatalog();
  if (!products.some((p) => p.productCode === productCode)) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
  await setOverride(productCode, patch);
  return NextResponse.json({ ok: true });
}
