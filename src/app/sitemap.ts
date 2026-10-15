import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/config/taxonomy";
import { getCatalog, getReadyKits } from "@/lib/server/repositories";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ products, info }, kits] = await Promise.all([getCatalog(), getReadyKits()]);
  const stat = ["", "/kit-olustur", "/hazir-kitler", "/katalog", "/kurumsal-surec", "/sss", "/hakkimizda", "/iletisim", "/kvkk", "/gizlilik", "/kullanim-kosullari"];
  return [
    ...stat.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...CATEGORIES.filter((c) => c.key !== "diger").map((c) => ({ url: `${SITE_URL}/kategori/${c.key}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...kits.map((k) => ({ url: `${SITE_URL}/hazir-kitler/${k.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    // Örnek (demo) ürünler indekslenmez
    ...(info.kind === "import"
      ? products.filter((p) => p.isActive).map((p) => ({ url: `${SITE_URL}/urun/${p.slug}`, lastModified: p.lastVerifiedAt ?? undefined, changeFrequency: "daily" as const, priority: 0.5 }))
      : []),
  ];
}
