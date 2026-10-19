import type { Product } from "./schema";

/**
 * Kaynak verisinde bulunmayan sınıflandırma alanlarını (kategori, amaç, hedef kitle, stil)
 * ürün adı/malzemesinden ŞEFFAF anahtar kelime kurallarıyla türetir. Bunlar öneri sıralaması
 * içindir; ürün özelliği olarak kullanıcıya gösterilmez.
 */

export function slugify(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const norm = (s: string) => slugify(s).replace(/-/g, " ");

/**
 * Tedarikçi alt kategorisi (ör. "Power Bank", "Kalem Usb Bellekler") → site kategorisi.
 * Sıra önemlidir: ilk eşleşen kazanır (ör. "kalem usb" önce teknolojiye düşer).
 */
const SUBCATEGORY_RULES: [string, RegExp][] = [
  ["kutu-ambalaj", /\b(koli|kutulari|set kutu)/],
  ["teknoloji", /\b(usb|bellek|power ?bank|sarj|speaker|kulaklik|radyo|adaptor|airtag|selfie|magsafe|lamba|kamera)/],
  ["masaustu", /\b(kalemlik|bardak altlik|mouse ?pad|kartvizitlik|masa set|ofis set|masa sumen|numarator|telefon stand|para tabak|kullu|hesap makine|menu kap|yaka kart|not tutucu)/],
  ["kirtasiye", /\b(kalemtras|silgi|cetvel|boyama|post it|cizim tahta|sinav set)/],
  ["kalem", /\b(kalem)/],
  ["canta", /\b(termos canta|canta)/],
  ["termos-matara", /\b(termos|matara|karaf)/],
  ["kupa-bardak", /\b(bardak|kupa|fincan|french press)/],
  ["defter-ajanda", /\b(defter|ajanda|bloknot|organizer|sekreterlik)/],
  ["takvim", /\b(takvim)/],
  ["saat", /\b(saat)/],
  ["plaket-odul", /\b(plaket|madalya)/],
  ["anahtarlik", /\b(anahtarlik)/],
  ["cakmak", /\b(cakmak|kibrit)/],
  ["tekstil", /\b(tisort|sweat|sapka|bere|atki|sal|boyunluk|yelek|mont|yagmurluk|battaniye|onluk)/],
  ["rozet-magnet", /\b(rozet|balon|magnet|bayrak|yoyo|stres topu|frizbi|duduk|bileklik|yelpaze)/],
  ["oto-yasam", /\b(araba|ruhsat|caki|fener|semsiye|ayna|manikur|dis firca|el fani|mutfak|metre|bavul|pasaport|supurge|acil durum|bitki)/],
  ["doga-dostu", /\b(geri donusum)/],
];

export function classifySubcategory(sub: string | null | undefined): string | null {
  if (!sub) return null;
  const t = norm(sub);
  for (const [cat, re] of SUBCATEGORY_RULES) if (re.test(t)) return cat;
  return null;
}

const CATEGORY_RULES: [string, RegExp][] = [
  ["saat", /\b(duvar saati|mekanizmali saat|saatli duvar)/],
  ["anahtarlik", /\b(anahtarlik)/],
  ["plaket-odul", /\b(plaket|madalya|kupa odul|odul)/],
  ["hediye-set", /\b(hediye set|set\b|kutulu set|ikili set|uclu set|dortlu set)/],
  ["termos-matara", /\b(termos|matara|suluk|vakum|bidon|shaker|tumbler)/],
  ["kupa-bardak", /\b(kupa|bardak|mug|fincan|kadeh)/],
  ["defter-ajanda", /\b(defter|ajanda|bloknot|notluk|not defteri|planlayici|organizer|sekreterlik)/],
  ["kalem", /\b(kalem|roller|tukenmez|dolma|kursun kalem|versatil)/],
  ["teknoloji", /\b(powerbank|sarj|hoparlor|speaker|kulaklik|usb|bellek|kablosuz|bluetooth|adaptor|mouse|webcam|isikli)/],
  ["canta", /\b(canta|sirt|laptop|evrak|valiz|bez canta|kese|torba)/],
  ["tekstil", /\b(tisort|t shirt|polo|sweat|polar|sapka|bere|atki|yelek|mont|havlu|ceket|hirka)/],
  ["masaustu", /\b(masaustu|masa ustu|kartlik|kartvizitlik|kalemlik|saat|takvim|mousepad|kup|stand|organizer)/],
  ["kutu-ambalaj", /\b(kutu|ambalaj|paket|hediye kutusu)/],
  ["doga-dostu", /\b(bambu|geri donusum|rpet|mantar|organik|bugday|kraft|eko)/],
];

export function classifyCategory(...texts: (string | null | undefined)[]): string | null {
  const t = norm(texts.filter(Boolean).join(" "));
  for (const [cat, re] of CATEGORY_RULES) if (re.test(t)) return cat;
  return null;
}

const CATEGORY_OCCASIONS: Record<string, string[]> = {
  saat: ["dealer", "client", "seasonal", "other"],
  anahtarlik: ["event", "seasonal", "other"],
  "plaket-odul": ["vip", "dealer", "other"],
  "termos-matara": ["welcome", "client", "dealer", "vip", "seasonal", "education", "other"],
  "kupa-bardak": ["welcome", "seasonal", "event", "other"],
  "defter-ajanda": ["welcome", "client", "dealer", "education", "event", "seasonal", "other"],
  kalem: ["welcome", "client", "event", "education", "vip", "other"],
  teknoloji: ["client", "dealer", "vip", "welcome", "other"],
  canta: ["event", "welcome", "education", "dealer", "other"],
  tekstil: ["welcome", "event", "education", "other"],
  masaustu: ["client", "vip", "dealer", "welcome", "other"],
  "hediye-set": ["vip", "client", "dealer", "seasonal", "other"],
  "kutu-ambalaj": ["welcome", "client", "dealer", "vip", "seasonal", "other"],
  "doga-dostu": ["event", "education", "welcome", "other"],
  takvim: ["client", "dealer", "seasonal", "other"],
  cakmak: ["event", "dealer", "other"],
  kirtasiye: ["education", "event", "other"],
  "rozet-magnet": ["event", "education", "other"],
  "oto-yasam": ["dealer", "client", "event", "other"],
};

const CATEGORY_AUDIENCE: Record<string, string[]> = {
  saat: ["partners", "clients", "general"],
  anahtarlik: ["attendees", "general", "employees"],
  "plaket-odul": ["executives", "partners", "employees"],
  "termos-matara": ["employees", "clients", "partners", "executives", "general"],
  "kupa-bardak": ["employees", "attendees", "general"],
  "defter-ajanda": ["employees", "clients", "students", "attendees", "executives"],
  kalem: ["employees", "clients", "students", "attendees", "general", "executives"],
  teknoloji: ["clients", "partners", "executives", "employees"],
  canta: ["attendees", "students", "employees", "general"],
  tekstil: ["employees", "attendees", "students", "general"],
  masaustu: ["executives", "clients", "partners"],
  "hediye-set": ["executives", "clients", "partners"],
  "kutu-ambalaj": ["employees", "clients", "partners", "executives"],
  "doga-dostu": ["attendees", "students", "general", "employees"],
};

const STYLE_RULES: [string, RegExp][] = [
  ["eco", /\b(bambu|geri donusum|rpet|mantar|organik|bugday|kraft|eko|pamuk)/],
  ["luxury", /\b(deri|metal|celik|premium|lux|luks|ahsap|ceviz|cam|siyah|altin|gumus)/],
  ["tech", /\b(powerbank|sarj|kablosuz|bluetooth|usb|led|akilli|dijital|isikli)/],
  ["minimal", /\b(mat|minimal|beyaz|siyah|gri|antrasit|sade)/],
  ["classic", /\b(deri|klasik|lacivert|bordo|ahsap|ajanda|dolma)/],
  ["dynamic", /\b(spor|renkli|neon|sweat|sapka|shaker|sirt)/],
  ["creative", /\b(renkli|desenli|baskili|pastel|turuncu|sari|yesil|mor)/],
];

export function deriveStyles(text: string, category: string | null): string[] {
  const t = norm(text);
  const out = STYLE_RULES.filter(([, re]) => re.test(t)).map(([k]) => k);
  if (category === "teknoloji" && !out.includes("tech")) out.push("tech");
  if (category === "doga-dostu" && !out.includes("eco")) out.push("eco");
  return out.length ? out : ["minimal", "classic"];
}

export function deriveTags(p: Pick<Product, "name" | "material" | "category" | "description">) {
  const text = [p.name, p.material, p.description].filter(Boolean).join(" ");
  return {
    giftOccasions: CATEGORY_OCCASIONS[p.category] ?? ["other"],
    targetAudience: CATEGORY_AUDIENCE[p.category] ?? ["general"],
    styles: deriveStyles(text, p.category),
  };
}

/** Yalnızca doğrulanmış fiyattan seviye türetilir; fiyat yoksa null kalır. */
export function budgetTierFromPrice(price: number | null): Product["budgetTier"] {
  if (price === null) return null;
  if (price < 120) return "economy";
  if (price < 350) return "mid";
  if (price < 900) return "premium";
  return "luxury";
}

const COMPLETENESS_FIELDS: (keyof Product)[] = [
  "name",
  "category",
  "description",
  "material",
  "dimensions",
  "imageOriginalUrl",
  "price",
  "stockQuantity",
  "availableColors",
  "printingMethods",
];

export function completeness(p: Partial<Product>): number {
  let filled = 0;
  for (const f of COMPLETENESS_FIELDS) {
    const v = p[f];
    if (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "") filled++;
  }
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100) / 100;
}

/** Yaygın Türkçe renk adları → swatch rengi */
const COLOR_HEX: Record<string, string> = {
  siyah: "#1a1a1a",
  beyaz: "#f5f5f2",
  gri: "#8c8c8c",
  antrasit: "#3a3d42",
  lacivert: "#1d2b4f",
  mavi: "#2f62c4",
  "acik mavi": "#8db8e8",
  kirmizi: "#b3261e",
  bordo: "#6d1a2a",
  yesil: "#2f7d4f",
  "haki": "#6b6b3a",
  sari: "#e6c229",
  turuncu: "#e07a1f",
  mor: "#6a3d9a",
  pembe: "#e58fb0",
  kahverengi: "#6b4a2f",
  kahve: "#6b4a2f",
  taba: "#a0632f",
  bej: "#d9c7a7",
  krem: "#efe6d2",
  gumus: "#c0c3c7",
  altin: "#c8a96a",
  "rose gold": "#c99a8a",
  turkuaz: "#2bb3b1",
  naturel: "#d8c3a0",
  bambu: "#c9a76a",
  seffaf: "#e8eef2",
};

export function colorHex(name: string | null): string | null {
  if (!name) return null;
  return COLOR_HEX[norm(name)] ?? null;
}
