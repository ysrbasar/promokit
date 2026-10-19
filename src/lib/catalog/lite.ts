import type { Product, StockStatus } from "./schema";

/** İstemciye gönderilen hafif ürün görünümü (kaynak notları ve ham alanlar olmadan) */
export type LiteProduct = {
  productCode: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string | null;
  image: string | null;
  material: string | null;
  capacity: string | null;
  dimensions: string | null;
  colors: string[];
  variants: { code: string; color: string | null; colorHex: string | null; stockQuantity: number | null; label: string | null; price: number | null; incoming: { qty: number; date: string }[]; options: { name: string; value: string }[]; image: string | null }[];
  gallery: string[];
  minOrderQty: number | null;
  stockKept: boolean;
  setContents: { code: string; name: string }[];
  stockStatus: StockStatus;
  price: number | null;
  priceCurrency: string | null;
  priceType: Product["priceType"];
  printingMethods: string[];
  isDemo: boolean;
};

export function productImage(p: Pick<Product, "localImagePath" | "imageOriginalUrl">): string | null {
  return p.localImagePath ?? p.imageOriginalUrl ?? null;
}

export function toLite(p: Product): LiteProduct {
  return {
    productCode: p.productCode,
    name: p.name,
    slug: p.slug,
    category: p.category,
    subcategory: p.subcategory,
    image: productImage(p),
    material: p.material,
    capacity: p.capacity,
    dimensions: p.dimensions,
    colors: p.availableColors,
    variants: p.variants.map((v) => ({ code: v.code, color: v.color, colorHex: v.colorHex, stockQuantity: v.stockQuantity, label: v.label, price: v.price, incoming: v.incoming, options: v.options, image: v.imageUrl })),
    gallery: p.gallery.slice(0, 8),
    minOrderQty: p.minOrderQty,
    stockKept: p.stockKept,
    setContents: p.setContents,
    stockStatus: p.stockStatus,
    price: p.price,
    priceCurrency: p.priceCurrency,
    priceType: p.priceType,
    printingMethods: p.printingMethods,
    isDemo: p.isDemo,
  };
}

/** Hafif ürün için en yüksek stoklu uygun varyant (bkz. stock.pickVariant) */
export function bestLiteVariant(p: Pick<LiteProduct, "variants">, minStock: number, requiredQty = 0, preferred?: string | null) {
  const ok = p.variants.filter((v) => v.stockQuantity !== null && v.stockQuantity >= minStock && v.stockQuantity >= requiredQty);
  if (!ok.length) return null;
  return ok.find((v) => v.code === preferred) ?? [...ok].sort((a, b) => (b.stockQuantity ?? 0) - (a.stockQuantity ?? 0))[0];
}

/** Kit kapak görselleri: tek ürünlü (kutulu set) kitlerde ürünün galerisi, aksi halde her üründen bir görsel */
export function kitImages(products: Pick<LiteProduct, "productCode" | "name" | "category" | "image" | "gallery" | "slug">[]) {
  if (products.length === 1 && products[0].gallery.length > 1) {
    const p = products[0];
    return p.gallery.slice(0, 4).map((src, i) => ({ key: `${p.productCode}-${i}`, src, alt: `${p.name} görsel ${i + 1}`, category: p.category, href: `/urun/${p.slug}` }));
  }
  return products.slice(0, 4).map((p) => ({ key: p.productCode, src: p.image, alt: p.name, category: p.category, href: `/urun/${p.slug}` }));
}
