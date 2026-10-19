import { z } from "zod";

/**
 * KitBuilderState — kit içeriği üzerinde saf (yan etkisiz) işlemler.
 * Zustand mağazası bu fonksiyonları sarar; testler doğrudan bunları kullanır.
 */

export const KitLineSchema = z.object({
  productCode: z.string(),
  variantCode: z.string().nullable(),
  qty: z.number().int().min(1).max(20),
  personalization: z.array(z.string()).default([]),
  /** Seçilen logo baskı yöntemi (ör. "Lazer"); null = baskısız */
  printMethod: z.string().max(60).nullable().optional(),
});
export type KitLine = z.infer<typeof KitLineSchema>;

export const KitDraftSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Kaç kişi / kaç kit */
  kitQuantity: z.number().int().min(1).max(100000),
  lines: z.array(KitLineSchema),
  source: z.enum(["wizard", "free", "ready"]),
  readyKitSlug: z.string().nullable().default(null),
  answers: z.record(z.unknown()).nullable().default(null),
  updatedAt: z.string(),
});
export type KitDraft = z.infer<typeof KitDraftSchema>;

export const MAX_QTY_PER_KIT = 20;

export function emptyDraft(now = new Date().toISOString()): KitDraft {
  return {
    id: `kit_${Math.random().toString(36).slice(2, 10)}`,
    name: "Kitim",
    kitQuantity: 50,
    lines: [],
    source: "free",
    readyKitSlug: null,
    answers: null,
    updatedAt: now,
  };
}

const touch = (d: KitDraft): KitDraft => ({ ...d, updatedAt: new Date().toISOString() });

export function hasProduct(d: KitDraft, productCode: string) {
  return d.lines.some((l) => l.productCode === productCode);
}

/** Aynı ürün kodu ikinci kez eklenmez; mevcut satır olduğu gibi kalır. */
export function addLine(d: KitDraft, line: Omit<KitLine, "qty" | "personalization"> & Partial<KitLine>): KitDraft {
  if (hasProduct(d, line.productCode)) return d;
  return touch({
    ...d,
    lines: [
      ...d.lines,
      {
        productCode: line.productCode,
        variantCode: line.variantCode ?? null,
        qty: clampQty(line.qty ?? 1),
        personalization: line.personalization ?? [],
      },
    ],
  });
}

export function removeLine(d: KitDraft, productCode: string): KitDraft {
  return touch({ ...d, lines: d.lines.filter((l) => l.productCode !== productCode) });
}

export function setLineQty(d: KitDraft, productCode: string, qty: number): KitDraft {
  if (qty < 1) return removeLine(d, productCode);
  return touch({
    ...d,
    lines: d.lines.map((l) => (l.productCode === productCode ? { ...l, qty: clampQty(qty) } : l)),
  });
}

export function setLineVariant(d: KitDraft, productCode: string, variantCode: string | null): KitDraft {
  return touch({ ...d, lines: d.lines.map((l) => (l.productCode === productCode ? { ...l, variantCode } : l)) });
}

export function setLinePersonalization(d: KitDraft, productCode: string, personalization: string[]): KitDraft {
  return touch({
    ...d,
    lines: d.lines.map((l) => (l.productCode === productCode ? { ...l, personalization } : l)),
  });
}

/** Ürünü yerinde değiştirir (sırası korunur). Yeni ürün zaten kitteyse eski satır yalnızca kaldırılır. */
export function replaceLine(d: KitDraft, oldCode: string, next: { productCode: string; variantCode: string | null }): KitDraft {
  if (oldCode === next.productCode) return d;
  if (hasProduct(d, next.productCode)) return removeLine(d, oldCode);
  return touch({
    ...d,
    lines: d.lines.map((l) =>
      l.productCode === oldCode ? { ...l, productCode: next.productCode, variantCode: next.variantCode } : l,
    ),
  });
}

export function setKitQuantity(d: KitDraft, n: number): KitDraft {
  return touch({ ...d, kitQuantity: Math.max(1, Math.min(100000, Math.round(n) || 1)) });
}

export function totalPieces(d: KitDraft): number {
  return d.lines.reduce((s, l) => s + l.qty, 0);
}

function clampQty(n: number) {
  return Math.max(1, Math.min(MAX_QTY_PER_KIT, Math.round(n)));
}

/** localStorage'dan gelen veriyi doğrular; bozuk kayıt sessizce yok sayılır. */
export function parseSavedKits(raw: unknown): KitDraft[] {
  const r = z.array(KitDraftSchema).safeParse(raw);
  return r.success ? r.data : [];
}
