import Fuse from "fuse.js";
import type { Product } from "./schema";
import { isProductEligible, productStatus } from "./stock";
import { isVerifiedPrice } from "./pricing";

/** ProductSearchService: katalog arama, filtreleme ve sıralama (saf fonksiyonlar). */

export type SortKey = "relevance" | "name" | "stock" | "price-asc" | "price-desc" | "newest";

export type ProductQuery = {
  q?: string;
  category?: string;
  color?: string;
  material?: string;
  /** Yalnızca doğrulanmış fiyatlı ürünlerde uygulanır */
  maxPrice?: number;
  /** Varsayılan true: yalnız stok eşiğini geçenler */
  stockOnly?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

export type SearchResult = {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
};

export function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function normalizeCode(s: string): string {
  return s.toUpperCase().replace(/[\s._-]+/g, "");
}

function matchesCode(p: Product, q: string): boolean {
  const nq = normalizeCode(q);
  if (nq.length < 2) return false;
  if (normalizeCode(p.productCode).startsWith(nq)) return true;
  return p.variants.some((v) => normalizeCode(v.code).startsWith(nq));
}

export function filterProducts(products: Product[], query: ProductQuery, minStock: number): Product[] {
  const stockOnly = query.stockOnly ?? true;
  return products.filter((p) => {
    if (!p.isActive) return false;
    if (stockOnly && !isProductEligible(p, minStock)) return false;
    if (!stockOnly && productStatus(p, minStock) === "out") return false;
    if (query.category && p.category !== query.category) return false;
    if (query.color) {
      const c = normalize(query.color);
      if (!p.availableColors.some((x) => normalize(x) === c)) return false;
    }
    if (query.material) {
      if (!p.material || !normalize(p.material).includes(normalize(query.material))) return false;
    }
    if (query.maxPrice != null) {
      if (!isVerifiedPrice(p) || (p.price ?? Infinity) > query.maxPrice) return false;
    }
    return true;
  });
}

export function searchProducts(products: Product[], query: ProductQuery, minStock: number): SearchResult {
  let list = filterProducts(products, query, minStock);
  const q = query.q?.trim();

  if (q) {
    const byCode = list.filter((p) => matchesCode(p, q));
    const fuse = new Fuse(list, {
      keys: [
        { name: "name", weight: 0.6 },
        { name: "tags", weight: 0.15 },
        { name: "material", weight: 0.1 },
        { name: "description", weight: 0.15 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      getFn: (obj, path) => {
        const v = Fuse.config.getFn(obj, path);
        if (Array.isArray(v)) return v.map((x) => normalize(String(x)));
        return typeof v === "string" ? normalize(v) : v;
      },
    });
    const byText = fuse.search(normalize(q)).map((r) => r.item);
    const seen = new Set<string>();
    list = [...byCode, ...byText].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  }

  list = sortProducts(list, query.sort ?? (q ? "relevance" : "relevance"));

  const pageSize = Math.max(1, Math.min(96, query.pageSize ?? 24));
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount);
  return {
    items: list.slice((page - 1) * pageSize, page * pageSize),
    total: list.length,
    page,
    pageCount,
  };
}

export function sortProducts(list: Product[], sort: SortKey): Product[] {
  const arr = [...list];
  const price = (p: Product) => (isVerifiedPrice(p) ? (p.price as number) : null);
  switch (sort) {
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    case "stock":
      return arr.sort((a, b) => (b.stockQuantity ?? -1) - (a.stockQuantity ?? -1));
    case "price-asc":
    case "price-desc": {
      const dir = sort === "price-asc" ? 1 : -1;
      // Fiyatı doğrulanmamış ürünler her iki yönde de sona gider
      return arr.sort((a, b) => {
        const pa = price(a);
        const pb = price(b);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return (pa - pb) * dir;
      });
    }
    case "newest":
      return arr.sort((a, b) => (b.lastVerifiedAt ?? "").localeCompare(a.lastVerifiedAt ?? ""));
    default:
      return arr.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  }
}

export function facetValues(products: Product[]) {
  const colors = new Map<string, number>();
  const materials = new Map<string, number>();
  for (const p of products) {
    for (const c of p.availableColors) colors.set(c, (colors.get(c) ?? 0) + 1);
    if (p.material) materials.set(p.material, (materials.get(p.material) ?? 0) + 1);
  }
  const sorted = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
  return { colors: sorted(colors), materials: sorted(materials) };
}
