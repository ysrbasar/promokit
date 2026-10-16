import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { CATEGORIES } from "@/lib/config/taxonomy";
import { getCatalog, setOverrides } from "@/lib/server/repositories";

const Body = z
  .object({
    productCode: z.string().min(1).optional(),
    productCodes: z.array(z.string().min(1)).min(1).max(2000).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    category: z.enum(CATEGORIES.map((c) => c.key) as [string, ...string[]]).optional(),
  })
  .refine((b) => b.productCode || b.productCodes, "Ürün kodu gerekli");

/** PATCH: tek ürün (productCode) veya toplu (productCodes) değişiklik */
export async function PATCH(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  const { productCode, productCodes, ...patch } = parsed.data;
  const codes = [...new Set([...(productCodes ?? []), ...(productCode ? [productCode] : [])])];
  const { products } = await getCatalog();
  const known = new Set(products.map((p) => p.productCode));
  const missing = codes.filter((c) => !known.has(c));
  if (missing.length) return NextResponse.json({ error: `Ürün bulunamadı: ${missing.slice(0, 5).join(", ")}` }, { status: 404 });
  await setOverrides(codes, patch);
  return NextResponse.json({ ok: true, count: codes.length });
}
