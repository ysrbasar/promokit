import type { Product, Variant } from "@/lib/catalog/schema";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/config/settings";

export const settings: Settings = { ...DEFAULT_SETTINGS, minStock: 50 };

export function variant(code: string, stock: number | null, color = "Siyah"): Variant {
  return { code, color, colorHex: null, stockQuantity: stock, stockUpdatedAt: null, imageUrl: null, label: null, price: null, incoming: [], options: [] };
}

export function product(code: string, over: Partial<Product> = {}): Product {
  const variants = over.variants ?? [variant(`${code}-01`, 500)];
  return {
    id: code,
    productCode: code,
    name: `Ürün ${code}`,
    slug: code.toLowerCase(),
    category: "termos-matara",
    subcategory: null,
    description: null,
    technicalSpecifications: {},
    dimensions: null,
    material: null,
    capacity: null,
    availableColors: variants.map((v) => v.color).filter((c): c is string => !!c),
    variants,
    stockQuantity: variants.reduce((s, v) => s + (v.stockQuantity ?? 0), 0),
    stockStatus: "available",
    stockUpdatedAt: null,
    price: null,
    priceCurrency: null,
    priceType: null,
    sourcePage: null,
    sourceProductUrl: null,
    sourcePdfPage: null,
    imageOriginalUrl: null,
    localImagePath: null,
    gallery: [],
    printingMethods: [],
    tags: [],
    giftOccasions: ["welcome", "client"],
    targetAudience: ["employees"],
    styles: ["minimal"],
    budgetTier: null,
    isActive: true,
    isFeatured: false,
    dataCompleteness: 0.5,
    lastVerifiedAt: null,
    sources: [],
    needsReview: [],
    isDemo: false,
    vatRate: null,
    minOrderQty: null,
    stockKept: true,
    setContents: [],
    ...over,
  };
}
