import { NextResponse, type NextRequest } from "next/server";
import { toLite } from "@/lib/catalog/lite";
import { searchProducts, type SortKey } from "@/lib/catalog/search";
import { getCatalog, getSettings } from "@/lib/server/repositories";

/** GET /api/products?codes=A,B  veya  ?q=&category=&page= */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { products } = await getCatalog();
  const codes = sp.get("codes");
  if (codes) {
    const wanted = new Set(codes.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 100));
    return NextResponse.json({ products: products.filter((p) => wanted.has(p.productCode)).map(toLite) });
  }
  const settings = await getSettings();
  const r = searchProducts(
    products,
    {
      q: sp.get("q") ?? undefined,
      category: sp.get("category") ?? undefined,
      color: sp.get("color") ?? undefined,
      material: sp.get("material") ?? undefined,
      stockOnly: sp.get("stock") === "in",
      sort: (sp.get("sort") as SortKey) ?? undefined,
      page: Number(sp.get("page") ?? 1),
      pageSize: Number(sp.get("pageSize") ?? 24),
    },
    settings.minStock,
  );
  return NextResponse.json({ ...r, items: r.items.map(toLite) });
}
