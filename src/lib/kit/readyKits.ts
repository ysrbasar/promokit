import { z } from "zod";
import type { Product } from "../catalog/schema";
import { isProductEligible, pickVariant } from "../catalog/stock";
import type { Settings } from "../config/settings";
import { EMPTY_ANSWERS, buildKit, findAlternatives, type WizardAnswers } from "./recommendation";

export const ReadyKitSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  tagline: z.string(),
  description: z.string(),
  story: z.string(),
  audience: z.string(),
  purpose: z.string(),
  recommendedQuantity: z.string(),
  personalization: z.array(z.string()),
  tone: z.enum(["light", "dark"]).default("light"),
  rule: z.object({
    purpose: z.string().nullable().optional(),
    audience: z.string().nullable().optional(),
    style: z.string().nullable().optional(),
    budgetKey: z.string().nullable().optional(),
    categories: z.array(z.string()).optional(),
  }),
  items: z.array(z.object({ productCode: z.string(), qty: z.number().int().min(1).max(20), role: z.string().default("") })),
  isFeatured: z.boolean().default(false),
});
export type ReadyKit = z.infer<typeof ReadyKitSchema>;
export const ReadyKitsFile = z.object({ kits: z.array(ReadyKitSchema) });

export type ResolvedLine = {
  productCode: string;
  variantCode: string | null;
  qty: number;
  role: string;
  status: "ok" | "substituted" | "rule";
  /** Değiştirilen ürünün kodu (stok yetersiz veya katalogda yok) */
  replacedCode: string | null;
};

export type ResolvedKit = {
  kit: ReadyKit;
  lines: ResolvedLine[];
  availability: "available" | "partial";
  notes: string[];
};

export function ruleAnswers(kit: ReadyKit): WizardAnswers {
  return {
    ...EMPTY_ANSWERS,
    quantity: 0,
    purpose: kit.rule.purpose ?? null,
    audience: kit.rule.audience ?? null,
    style: kit.rule.style ?? null,
    budgetKey: kit.rule.budgetKey ?? null,
    categories: kit.rule.categories ?? [],
  };
}

/**
 * Hazır kiti gerçek ürün kayıtlarına bağlar. Stok koşulunu karşılamayan ürün kitte
 * "stokta" gibi gösterilmez: aynı kategoriden uygun alternatifle değiştirilir ya da
 * kuralla uygun bir ürün seçilir; bulunamazsa kit "kısmi" olarak işaretlenir.
 */
export function resolveReadyKit(kit: ReadyKit, products: Product[], settings: Settings): ResolvedKit {
  const map = new Map(products.map((p) => [p.productCode, p]));
  const answers = ruleAnswers(kit);
  const used = new Set<string>();
  const lines: ResolvedLine[] = [];
  const notes: string[] = [];
  let missing = 0;

  for (const item of kit.items) {
    const p = map.get(item.productCode);
    if (p && isProductEligible(p, settings.minStock) && !used.has(p.productCode)) {
      used.add(p.productCode);
      lines.push({
        productCode: p.productCode,
        variantCode: pickVariant(p, settings.minStock)?.code ?? null,
        qty: item.qty,
        role: item.role,
        status: "ok",
        replacedCode: null,
      });
      continue;
    }
    if (p) {
      const alt = findAlternatives(p, products, answers, settings, { limit: 1, exclude: [...used] })[0];
      if (alt) {
        used.add(alt.productCode);
        lines.push({
          productCode: alt.productCode,
          variantCode: pickVariant(alt, settings.minStock)?.code ?? null,
          qty: item.qty,
          role: item.role,
          status: "substituted",
          replacedCode: p.productCode,
        });
        notes.push(`${p.name} için stok yetersiz; benzer bir ürün önerildi.`);
        continue;
      }
    }
    missing++;
  }

  // Katalogda bulunmayan kodlar (ör. gerçek katalog yüklendikten sonra) kural motoruyla tamamlanır
  if (missing > 0) {
    const auto = buildKit(products, answers, settings);
    const coveredCats = new Set(lines.map((l) => map.get(l.productCode)?.category));
    for (const it of auto.items) {
      if (missing === 0) break;
      const p = map.get(it.productCode);
      if (!p || used.has(it.productCode) || coveredCats.has(p.category)) continue;
      used.add(it.productCode);
      coveredCats.add(p.category);
      lines.push({ productCode: it.productCode, variantCode: it.variantCode, qty: 1, role: "Önerilen", status: "rule", replacedCode: null });
      missing--;
    }
    if (missing > 0) notes.push("Bu kitin bazı ürünleri için şu an uygun stok bulunamadı; teklif aşamasında stok doğrulanacak.");
  }

  return { kit, lines, availability: missing > 0 ? "partial" : "available", notes };
}
