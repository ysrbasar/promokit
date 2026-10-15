import * as cheerio from "cheerio";
import { absoluteUrl } from "./prmstkParser";
import { cleanText, parsePrice } from "./parseValues";

/**
 * promosyonfirma.com ürün detay sayfası ayrıştırıcısı.
 * Öncelik yapılandırılmış veridir (JSON-LD Product, BreadcrumbList), ardından OpenGraph
 * ve görünür etiketler. Fiyat yalnızca açıkça sunulduysa alınır.
 */

export type SiteRecord = {
  url: string;
  code: string | null;
  name: string | null;
  description: string | null;
  images: string[];
  price: number | null;
  priceCurrency: string | null;
  breadcrumbs: string[];
  colors: string[];
  specs: Record<string, string>;
};

type JsonLd = Record<string, unknown>;

function flattenLd(node: unknown): JsonLd[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(flattenLd);
  const obj = node as JsonLd;
  const graph = obj["@graph"];
  return [obj, ...(graph ? flattenLd(graph) : [])];
}

const isType = (n: JsonLd, t: string) => {
  const v = n["@type"];
  return v === t || (Array.isArray(v) && v.includes(t));
};

const str = (v: unknown): string | null => (typeof v === "string" ? cleanText(v) : typeof v === "number" ? String(v) : null);

export function parseSitePage(html: string, url: string): SiteRecord | null {
  const $ = cheerio.load(html);
  const lds: JsonLd[] = [];
  $('script[type="application/ld+json"]').each((_, s) => {
    try {
      lds.push(...flattenLd(JSON.parse($(s).text())));
    } catch {
      /* bozuk JSON-LD yok sayılır */
    }
  });

  const product = lds.find((n) => isType(n, "Product"));
  const crumbsLd = lds.find((n) => isType(n, "BreadcrumbList"));

  let breadcrumbs: string[] = [];
  if (crumbsLd && Array.isArray(crumbsLd.itemListElement)) {
    breadcrumbs = (crumbsLd.itemListElement as JsonLd[])
      .map((i) => str(i.name) ?? str((i.item as JsonLd | undefined)?.name))
      .filter((x): x is string => !!x);
  } else {
    breadcrumbs = $(".breadcrumb a, nav[aria-label*=breadcrumb] a, .breadcrumbs a")
      .toArray()
      .map((a) => cleanText($(a).text()))
      .filter((x): x is string => !!x);
  }

  const specs: Record<string, string> = {};
  $("table tr").each((_, tr) => {
    const cells = $(tr).children("th,td");
    if (cells.length === 2) {
      const k = cleanText($(cells[0]).text());
      const v = cleanText($(cells[1]).text());
      if (k && v && k.length < 40 && v.length < 200) specs[k.replace(/[:：]$/, "")] = v;
    }
  });

  if (product) {
    const offers = (Array.isArray(product.offers) ? product.offers[0] : product.offers) as JsonLd | undefined;
    const rawImages = Array.isArray(product.image) ? product.image : product.image ? [product.image] : [];
    const images = rawImages
      .map((i) => absoluteUrl(typeof i === "string" ? i : str((i as JsonLd).url), url))
      .filter((x): x is string => !!x);
    const priceNum = offers ? Number(offers.price ?? offers.lowPrice) : NaN;
    return {
      url,
      code: str(product.sku) ?? str(product.mpn) ?? str(product.productID),
      name: str(product.name),
      description: str(product.description),
      images,
      price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null,
      priceCurrency: Number.isFinite(priceNum) && priceNum > 0 ? str(offers?.priceCurrency) ?? "TRY" : null,
      breadcrumbs,
      colors: (Array.isArray(product.color) ? product.color : product.color ? [product.color] : []).map(String),
      specs,
    };
  }

  // JSON-LD yoksa: yalnızca açık ürün sinyali varsa (ürün kodu etiketi) kayıt üret
  const body = $("body").text().replace(/\s+/g, " ");
  const code = body.match(/(?:ürün|urun|stok)\s*kod(?:u)?\s*[:：]\s*([A-Z0-9][A-Z0-9.\-/]{1,19})/i)?.[1] ?? null;
  if (!code) return null;
  const priceText = $("[itemprop=price], .price, .fiyat, .urun-fiyat").first().attr("content") ?? $("[itemprop=price], .price, .fiyat, .urun-fiyat").first().text();
  const price = parsePrice(priceText);
  const og = $('meta[property="og:image"]').attr("content");
  return {
    url,
    code: code.toUpperCase(),
    name: cleanText($('meta[property="og:title"]').attr("content")) ?? cleanText($("h1").first().text()),
    description: cleanText($('meta[name="description"]').attr("content")),
    images: [absoluteUrl(og, url)].filter((x): x is string => !!x),
    price: price?.amount ?? null,
    priceCurrency: price?.currency ?? null,
    breadcrumbs,
    colors: [],
    specs,
  };
}

/** sitemap.xml veya sitemap index içinden URL listesi */
export function parseSitemap(xml: string): { urls: string[]; sitemaps: string[] } {
  const $ = cheerio.load(xml, { xmlMode: true });
  return {
    urls: $("url > loc").toArray().map((e) => $(e).text().trim()),
    sitemaps: $("sitemap > loc").toArray().map((e) => $(e).text().trim()),
  };
}
