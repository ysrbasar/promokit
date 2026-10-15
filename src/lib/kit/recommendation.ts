import type { Product } from "../catalog/schema";
import { isProductEligible, pickVariant } from "../catalog/stock";
import { isVerifiedPrice } from "../catalog/pricing";
import type { Settings } from "../config/settings";
import { PRINTING_TO_PERSONALIZATION, categoryLabel, labelOf, PURPOSES, STYLES } from "../config/taxonomy";

/**
 * KitRecommendationEngine — kural tabanlı, deterministik ve test edilebilir öneri motoru.
 * Stok uygunluğu bir puan değil, ön koşuldur: uygun olmayan ürün hiç aday olmaz.
 */

export type WizardAnswers = {
  purpose: string | null;
  audience: string | null;
  quantity: number;
  budgetKey: string | null;
  style: string | null;
  categories: string[];
  excludeCategories: string[];
  personalization: string[];
  timing: string | null;
  deliveryDate?: string | null;
};

export const EMPTY_ANSWERS: WizardAnswers = {
  purpose: null,
  audience: null,
  quantity: 50,
  budgetKey: null,
  style: null,
  categories: [],
  excludeCategories: [],
  personalization: [],
  timing: null,
  deliveryDate: null,
};

export const SURPRISE = "surprise";

/** Kategori seçilmediğinde amaca göre varsayılan ürün grubu önceliği */
const PURPOSE_CATEGORY_PRIORITY: Record<string, string[]> = {
  welcome: ["termos-matara", "defter-ajanda", "kalem", "tekstil", "canta", "kutu-ambalaj"],
  client: ["termos-matara", "defter-ajanda", "kalem", "masaustu", "teknoloji", "kutu-ambalaj"],
  dealer: ["termos-matara", "teknoloji", "canta", "defter-ajanda", "kalem", "kutu-ambalaj"],
  event: ["canta", "kalem", "defter-ajanda", "kupa-bardak", "tekstil"],
  vip: ["hediye-set", "teknoloji", "termos-matara", "defter-ajanda", "kalem", "kutu-ambalaj"],
  education: ["defter-ajanda", "kalem", "canta", "termos-matara", "doga-dostu"],
  seasonal: ["kupa-bardak", "termos-matara", "defter-ajanda", "hediye-set", "kutu-ambalaj"],
  other: ["termos-matara", "defter-ajanda", "kalem", "teknoloji", "canta"],
};

const TIER_ORDER = ["economy", "mid", "premium", "luxury"] as const;

export type ScoredProduct = { product: Product; score: number; reasons: string[] };

export type KitItem = {
  productCode: string;
  variantCode: string | null;
  qty: number;
  score: number;
  reasons: string[];
};

export type KitRecommendation = {
  name: string;
  concept: string;
  items: KitItem[];
  alternatives: Record<string, string[]>;
  notes: string[];
  /** Hiç ürün bulunamadıysa kullanıcıya gösterilecek açıklama */
  emptyReason: string | null;
};

export function requiredQty(answers: WizardAnswers, settings: Settings): number {
  return settings.requireStockForKitQuantity ? Math.max(0, answers.quantity) : 0;
}

export function isCandidate(p: Product, answers: WizardAnswers, settings: Settings): boolean {
  if (answers.excludeCategories.includes(p.category)) return false;
  return isProductEligible(p, settings.minStock, requiredQty(answers, settings));
}

export function scoreProduct(p: Product, answers: WizardAnswers, settings: Settings): ScoredProduct {
  let score = 0;
  const reasons: string[] = [];

  const wanted = answers.categories.filter((c) => c !== SURPRISE);
  if (wanted.length && wanted.includes(p.category)) {
    score += 4;
    reasons.push("Seçtiğiniz ürün grubunda");
  }
  if (answers.purpose && p.giftOccasions.includes(answers.purpose)) {
    score += 3;
    reasons.push(`${labelOf(PURPOSES, answers.purpose)} için uygun`);
  }
  if (answers.audience && p.targetAudience.includes(answers.audience)) {
    score += 2;
    reasons.push("Hedef kitlenizle uyumlu");
  }
  if (answers.style && p.styles.includes(answers.style)) {
    score += 2;
    reasons.push(`${labelOf(STYLES, answers.style)} stile uygun`);
  }

  const tier = settings.budgetTiers.find((t) => t.key === answers.budgetKey);
  if (tier?.tier && p.budgetTier) {
    const d = Math.abs(TIER_ORDER.indexOf(tier.tier) - TIER_ORDER.indexOf(p.budgetTier));
    score += d === 0 ? 2 : d === 1 ? 0.5 : -2;
    if (d === 0) reasons.push("Bütçe seviyenize uygun");
  }
  if (tier?.max != null && isVerifiedPrice(p)) {
    const share = tier.max / tier.itemCount;
    if ((p.price as number) > share * 1.6) score -= 3;
    else if ((p.price as number) <= share) score += 1;
  }

  const caps = new Set(p.printingMethods.map((m) => PRINTING_TO_PERSONALIZATION[m]).filter(Boolean));
  for (const want of answers.personalization) {
    if (caps.has(want)) {
      score += 1;
      reasons.push(want === "laser" ? "Lazer kazımaya uygun" : "Logo baskısına uygun");
    }
  }

  if (p.isFeatured) score += 0.5;
  score += p.dataCompleteness * 0.5;
  // Deterministik eşitlik bozucu: daha fazla stok, daha güvenli tedarik
  score += Math.min(1, (p.stockQuantity ?? 0) / 10000) * 0.2;

  return { product: p, score: round(score), reasons };
}

export function rankCandidates(products: Product[], answers: WizardAnswers, settings: Settings): ScoredProduct[] {
  return products
    .filter((p) => isCandidate(p, answers, settings))
    .map((p) => scoreProduct(p, answers, settings))
    .sort((a, b) => b.score - a.score || a.product.productCode.localeCompare(b.product.productCode));
}

/** Aynı kategoride, stoklu ve stil/fiyat olarak benzer alternatifler */
export function findAlternatives(
  target: Product,
  products: Product[],
  answers: WizardAnswers,
  settings: Settings,
  opts: { limit?: number; exclude?: string[] } = {},
): Product[] {
  const exclude = new Set([target.productCode, ...(opts.exclude ?? [])]);
  const targetPrice = isVerifiedPrice(target) ? (target.price as number) : null;
  return products
    .filter((p) => p.category === target.category && !exclude.has(p.productCode))
    .filter((p) => isCandidate(p, answers, settings))
    .map((p) => {
      let s = scoreProduct(p, answers, settings).score;
      s += p.styles.filter((x) => target.styles.includes(x)).length * 0.5;
      if (p.subcategory && p.subcategory === target.subcategory) s += 1;
      if (targetPrice !== null && isVerifiedPrice(p)) {
        s -= Math.min(2, Math.abs((p.price as number) - targetPrice) / Math.max(1, targetPrice));
      }
      return { p, s };
    })
    .sort((a, b) => b.s - a.s || a.p.productCode.localeCompare(b.p.productCode))
    .slice(0, opts.limit ?? 3)
    .map((x) => x.p);
}

export function buildKit(products: Product[], answers: WizardAnswers, settings: Settings): KitRecommendation {
  const tier = settings.budgetTiers.find((t) => t.key === answers.budgetKey) ?? null;
  const count = tier?.itemCount ?? 4;
  const ranked = rankCandidates(products, answers, settings);
  const notes: string[] = [];
  const req = requiredQty(answers, settings);

  if (ranked.length === 0) {
    return {
      name: kitName(answers),
      concept: kitConcept(answers),
      items: [],
      alternatives: {},
      notes,
      emptyReason:
        req > 0
          ? `Seçimlerinize uyan ve ${req} kit için yeterli stoğu bulunan ürün bulunamadı. Kit adedini azaltmayı, hariç tuttuğunuz kategorileri açmayı ya da serbest katalogdan seçim yapmayı deneyebilirsiniz.`
          : "Seçimlerinize uyan stoklu ürün bulunamadı. Ürün gruplarını genişletmeyi veya serbest katalogdan seçim yapmayı deneyebilirsiniz.",
    };
  }

  const wanted = answers.categories.filter((c) => c !== SURPRISE && !answers.excludeCategories.includes(c));
  const order = wanted.length ? wanted : PURPOSE_CATEGORY_PRIORITY[answers.purpose ?? "other"] ?? PURPOSE_CATEGORY_PRIORITY.other;
  const picked: ScoredProduct[] = [];
  const used = new Set<string>();

  // 1) Her istenen kategoriden en iyi ürün
  for (const cat of order) {
    if (picked.length >= count) break;
    const best = ranked.find((r) => r.product.category === cat && !used.has(r.product.productCode));
    if (best) {
      picked.push(best);
      used.add(best.product.productCode);
    } else if (wanted.includes(cat)) {
      notes.push(`${categoryLabel(cat)} grubunda stok koşulunu karşılayan ürün bulunamadı.`);
    }
  }

  // 2) Kalan yerleri farklı kategorilerden doldur (sürpriz veya kategori sayısı yetmediğinde)
  const allowOtherCategories = !wanted.length || answers.categories.includes(SURPRISE) || picked.length < Math.min(count, 2);
  if (allowOtherCategories) {
    for (const r of ranked) {
      if (picked.length >= count) break;
      if (used.has(r.product.productCode)) continue;
      if (picked.some((x) => x.product.category === r.product.category)) continue;
      picked.push({ ...r, reasons: [...r.reasons, "Kiti tamamlayan öneri"] });
      used.add(r.product.productCode);
    }
  }
  // 3) Aynı kategoriyi tekrarlamadan önce, hariç tutulmadıysa bir sunum kutusu ekle
  if (picked.length < count && !answers.excludeCategories.includes("kutu-ambalaj") && !picked.some((x) => x.product.category === "kutu-ambalaj")) {
    const box = ranked.find((r) => r.product.category === "kutu-ambalaj" && !used.has(r.product.productCode));
    if (box) {
      picked.push({ ...box, reasons: [...box.reasons, "Kitin sunum kutusu"] });
      used.add(box.product.productCode);
    }
  }
  // 4) Hâlâ eksikse istenen kategorilerden ikinci ürünler
  for (const r of ranked) {
    if (picked.length >= count) break;
    if (used.has(r.product.productCode)) continue;
    if (wanted.length && !wanted.includes(r.product.category) && !allowOtherCategories) continue;
    picked.push(r);
    used.add(r.product.productCode);
  }

  // Bütçe kontrolü: yalnızca tüm fiyatlar güvenilirse uygulanır; aşımda ürünler sessizce
  // pahalılaştırılmaz, daha uygun alternatifle değiştirilir veya kit küçültülür.
  if (tier?.max != null) {
    const allPriced = picked.every((r) => isVerifiedPrice(r.product));
    if (!allPriced) {
      notes.push("Bazı ürünlerin fiyatı doğrulanmadığı için bütçe uyumu teklif aşamasında netleşecek.");
    } else {
      let guard = 0;
      while (sum(picked) > tier.max && guard++ < 20) {
        const idx = picked.reduce((m, r, i, a) => ((r.product.price as number) > (a[m].product.price as number) ? i : m), 0);
        const cur = picked[idx];
        const cheaper = ranked.find(
          (r) =>
            r.product.category === cur.product.category &&
            !used.has(r.product.productCode) &&
            isVerifiedPrice(r.product) &&
            (r.product.price as number) < (cur.product.price as number),
        );
        if (cheaper) {
          used.add(cheaper.product.productCode);
          picked[idx] = { ...cheaper, reasons: [...cheaper.reasons, "Bütçenize göre daha uygun alternatif"] };
          notes.push(`${cur.product.name}, bütçenize uyması için ${cheaper.product.name} ile değiştirildi.`);
        } else if (picked.length > 2) {
          notes.push(`${cur.product.name} bütçeyi aştığı için kitten çıkarıldı.`);
          picked.splice(idx, 1);
        } else {
          notes.push("Bu bütçeyle uyumlu stoklu kombinasyon bulunamadı; en yakın seçenek gösteriliyor.");
          break;
        }
      }
    }
  }

  if (picked.length < count) {
    notes.push(`Stok koşulunu karşılayan ${picked.length} uygun ürün bulundu (hedef ${count}).`);
  }

  const pickedCodes = picked.map((r) => r.product.productCode);
  const alternatives: Record<string, string[]> = {};
  for (const r of picked) {
    alternatives[r.product.productCode] = findAlternatives(r.product, products, answers, settings, {
      exclude: pickedCodes,
    }).map((p) => p.productCode);
  }

  return {
    name: kitName(answers),
    concept: kitConcept(answers),
    items: picked.map((r) => ({
      productCode: r.product.productCode,
      variantCode: pickVariant(r.product, settings.minStock, req)?.code ?? null,
      qty: 1,
      score: r.score,
      reasons: r.reasons,
    })),
    alternatives,
    notes,
    emptyReason: null,
  };
}

function sum(list: ScoredProduct[]) {
  return list.reduce((s, r) => s + (r.product.price ?? 0), 0);
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

const PURPOSE_NAMES: Record<string, string> = {
  welcome: "Welcome",
  client: "Müşteri Seçkisi",
  dealer: "Bayi Teşekkür",
  event: "Etkinlik",
  vip: "VIP Signature",
  education: "Kampüs",
  seasonal: "Özel Gün",
  other: "Kurumsal",
};
const STYLE_NAMES: Record<string, string> = {
  minimal: "Minimal",
  luxury: "Prestige",
  tech: "Tech",
  eco: "Terra",
  dynamic: "Pulse",
  classic: "Heritage",
  creative: "Palette",
};

export function kitName(a: WizardAnswers): string {
  const p = PURPOSE_NAMES[a.purpose ?? "other"] ?? "Kurumsal";
  const s = a.style ? STYLE_NAMES[a.style] : null;
  return s ? `${p} ${s} Kiti` : `${p} Kiti`;
}

export function kitConcept(a: WizardAnswers): string {
  // Yalnızca ilk harf küçültülür; "VIP" gibi kısaltmalar korunur
  const lcFirst = (t: string) => t.charAt(0).toLocaleLowerCase("tr-TR") + t.slice(1);
  const purpose = a.purpose ? labelOf(PURPOSES, a.purpose) : "Kurumsal hediye";
  const style = a.style ? lcFirst(labelOf(STYLES, a.style)) : "dengeli";
  return `${purpose} için ${style} bir çizgide, stokta bulunan ürünlerden oluşturulmuş seçki.`;
}
