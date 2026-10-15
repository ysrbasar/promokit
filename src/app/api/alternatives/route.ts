import { NextResponse, type NextRequest } from "next/server";
import { toLite } from "@/lib/catalog/lite";
import { EMPTY_ANSWERS, findAlternatives } from "@/lib/kit/recommendation";
import { getCatalog, getSettings } from "@/lib/server/repositories";

/** GET /api/alternatives?code=X&quantity=50&exclude=A,B&style=minimal */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const [{ products }, settings] = await Promise.all([getCatalog(), getSettings()]);
  const target = products.find((p) => p.productCode === sp.get("code"));
  if (!target) return NextResponse.json({ products: [] }, { status: 404 });
  const answers = {
    ...EMPTY_ANSWERS,
    quantity: Math.max(0, Math.min(100000, Number(sp.get("quantity") ?? 0) || 0)),
    style: sp.get("style"),
    purpose: sp.get("purpose"),
  };
  const alts = findAlternatives(target, products, answers, settings, {
    limit: 4,
    exclude: (sp.get("exclude") ?? "").split(",").filter(Boolean),
  });
  return NextResponse.json({ products: alts.map(toLite) });
}
