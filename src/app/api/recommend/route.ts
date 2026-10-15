import { NextResponse } from "next/server";
import { z } from "zod";
import { toLite } from "@/lib/catalog/lite";
import { buildKit } from "@/lib/kit/recommendation";
import { getCatalog, getSettings } from "@/lib/server/repositories";

const Answers = z.object({
  purpose: z.string().nullable(),
  audience: z.string().nullable(),
  quantity: z.number().int().min(0).max(100000),
  budgetKey: z.string().nullable(),
  style: z.string().nullable(),
  categories: z.array(z.string()).max(20),
  excludeCategories: z.array(z.string()).max(20),
  personalization: z.array(z.string()).max(10),
  timing: z.string().nullable(),
  deliveryDate: z.string().nullable().optional(),
});

/** POST /api/recommend — sihirbaz cevaplarından kural tabanlı kit önerisi */
export async function POST(req: Request) {
  const parsed = Answers.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz cevaplar" }, { status: 400 });
  const [{ products }, settings] = await Promise.all([getCatalog(), getSettings()]);
  const kit = buildKit(products, parsed.data, settings);
  const codes = new Set([...kit.items.map((i) => i.productCode), ...Object.values(kit.alternatives).flat()]);
  return NextResponse.json({ kit, products: products.filter((p) => codes.has(p.productCode)).map(toLite) });
}
