import { z } from "zod";

/**
 * Yönetilebilir iş kuralları. Varsayılanlar burada; yönetim panelinden yapılan
 * değişiklikler data/runtime/settings.json içinde saklanır ve bunları ezer.
 */
export const BudgetTierSchema = z.object({
  key: z.string(),
  label: z.string(),
  /** Kişi başı kit bütçesi (TL). null = sınır yok / belirtilmedi */
  min: z.number().nullable(),
  max: z.number().nullable(),
  /** Önerilecek ürün sayısı */
  itemCount: z.number().int().min(1).max(10),
  tier: z.enum(["economy", "mid", "premium", "luxury"]).nullable(),
});
export type BudgetTier = z.infer<typeof BudgetTierSchema>;

export const SettingsSchema = z.object({
  /** Bu değerin altındaki stoklu varyantlar varsayılan katalogda ve önerilerde gizlenir */
  minStock: z.number().int().min(1).max(100000),
  budgetTiers: z.array(BudgetTierSchema).min(1),
  /** Kit önerisinde varyant stoğunun kit adedini karşılaması zorunlu mu */
  requireStockForKitQuantity: z.boolean(),
  /** Tedarikçi baskı fiyatlarına eklenen kâr payı (%). Müşteri baskı fiyatını bu payla görür. */
  printMarkupPct: z.number().min(0).max(500),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  minStock: 50,
  requireStockForKitQuantity: true,
  printMarkupPct: 0,
  budgetTiers: [
    { key: "economy", label: "Ekonomik", min: null, max: 300, itemCount: 3, tier: "economy" },
    { key: "lt500", label: "500 TL altı", min: null, max: 500, itemCount: 3, tier: "economy" },
    { key: "500-1000", label: "500–1.000 TL", min: 500, max: 1000, itemCount: 4, tier: "mid" },
    { key: "1000-2000", label: "1.000–2.000 TL", min: 1000, max: 2000, itemCount: 5, tier: "premium" },
    { key: "2000-5000", label: "2.000–5.000 TL", min: 2000, max: 5000, itemCount: 5, tier: "luxury" },
    { key: "5000+", label: "5.000 TL üzeri", min: 5000, max: null, itemCount: 6, tier: "luxury" },
    { key: "open", label: "Bütçemi belirlemedim", min: null, max: null, itemCount: 4, tier: null },
  ],
};
