import { z } from "zod";

/**
 * Fiyatın niteliği. Yalnızca "source" kaynakta doğrulanmış fiyattır.
 * "demo" örnek katalogda arayüzü göstermek için kullanılır ve her yerde etiketlenir.
 */
export const PriceType = z.enum(["source", "estimated", "demo"]);
export type PriceType = z.infer<typeof PriceType>;

export const StockStatus = z.enum(["available", "low", "out", "unknown"]);
export type StockStatus = z.infer<typeof StockStatus>;

export const Variant = z.object({
  code: z.string().min(1),
  color: z.string().nullable(),
  colorHex: z.string().nullable().default(null),
  /** null = stok bilinmiyor (0 ile aynı şey değildir) */
  stockQuantity: z.number().int().nonnegative().nullable(),
  stockUpdatedAt: z.string().nullable(),
  imageUrl: z.string().nullable().default(null),
});
export type Variant = z.infer<typeof Variant>;

export const SourceNote = z.object({
  field: z.string(),
  source: z.enum(["prmstk", "pdf", "site", "admin", "demo"]),
  value: z.string(),
  note: z.string().optional(),
});
export type SourceNote = z.infer<typeof SourceNote>;

export const Product = z.object({
  id: z.string(),
  productCode: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  category: z.string(),
  subcategory: z.string().nullable(),
  description: z.string().nullable(),
  technicalSpecifications: z.record(z.string()).default({}),
  dimensions: z.string().nullable(),
  material: z.string().nullable(),
  capacity: z.string().nullable(),
  availableColors: z.array(z.string()).default([]),
  variants: z.array(Variant).default([]),
  stockQuantity: z.number().int().nonnegative().nullable(),
  stockStatus: StockStatus,
  stockUpdatedAt: z.string().nullable(),
  price: z.number().nonnegative().nullable(),
  priceCurrency: z.string().nullable(),
  priceType: PriceType.nullable(),
  sourcePage: z.string().nullable(),
  sourceProductUrl: z.string().nullable(),
  sourcePdfPage: z.number().int().nullable(),
  imageOriginalUrl: z.string().nullable(),
  localImagePath: z.string().nullable(),
  gallery: z.array(z.string()).default([]),
  printingMethods: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  giftOccasions: z.array(z.string()).default([]),
  targetAudience: z.array(z.string()).default([]),
  styles: z.array(z.string()).default([]),
  budgetTier: z.enum(["economy", "mid", "premium", "luxury"]).nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  /** 0–1 arası; doldurulmuş önemli alanların oranı */
  dataCompleteness: z.number().min(0).max(1),
  lastVerifiedAt: z.string().nullable(),
  /** Kaynaklar arası çelişkiler ve alanların geldiği yer */
  sources: z.array(SourceNote).default([]),
  needsReview: z.array(z.string()).default([]),
  isDemo: z.boolean().default(false),
});
export type Product = z.infer<typeof Product>;

export const CatalogFile = z.object({
  meta: z.object({
    kind: z.enum(["import", "demo"]),
    generatedAt: z.string(),
    note: z.string().optional(),
  }),
  products: z.array(Product),
});
export type CatalogFile = z.infer<typeof CatalogFile>;
