/**
 * Logo baskı fiyatları — kaynak: ipromosyon.com/sayfa/baski-fiyatlari ("2026/2027 Baskı Fiyatları", KDV hariç).
 * Fiyatlar ürün grubuna (tedarikçi alt kategorisi) ve baskı yöntemine göre değişir; tek taraf / tek logo içindir.
 * Kural türleri:
 *  - min:   adet ≤ upto ise sabit `fixed` TL, üzerinde adet başı `unit` TL   ("70 adet altı sabit 840 tl, üzeri 12 tl")
 *  - tiers: adet aralığına göre adet başı fiyat, en az `minFee` TL
 *  - gofre: kalıp/klişe (950 TL) + 100 adede kadar sabit 1300 TL, sonra 13 / 11 / 9 TL
 *  - included: baskı ürün fiyatına dahil
 *  - custom:   tedarikçi özel fiyatlandırma yapar (teklifte bildirilir)
 */

export type PrintRule =
  | { kind: "min"; upto: number; fixed: number; unit: number }
  | { kind: "tiers"; minFee: number; tiers: { from: number; unit: number }[] }
  | { kind: "gofre" }
  | { kind: "included" }
  | { kind: "custom" };

/** Yöntem anahtarları; XML'deki adlar (Lazer, Uv Dijital, Dtf Uv Dijital…) bunlara indirgenir */
export type MethodKey = "lazer" | "karbon" | "lazer3d" | "uv" | "dtf" | "serigrafi" | "ofset" | "gofre" | "domeks" | "sublimasyon" | "transfer" | "nakis" | "firin" | "dokum";

const min = (upto: number, fixed: number, unit: number): PrintRule => ({ kind: "min", upto, fixed, unit });
const GOFRE: PrintRule = { kind: "gofre" };
const INCLUDED: PrintRule = { kind: "included" };
const CUSTOM: PrintRule = { kind: "custom" };

type Group = { key: string; label: string; match: RegExp; rules: Partial<Record<MethodKey, PrintRule>>; note?: string };

/** Sıra önemlidir: ilk eşleşen grup kullanılır (alt kategori, Türkçe karakterleri sadeleştirilmiş halde aranır) */
export const PRINT_GROUPS: Group[] = [
  { key: "kalem-kutu", label: "Kalem kutuları", match: /kalem kutu/, rules: { uv: min(50, 1000, 20), lazer: min(100, 850, 8.5) } },
  { key: "kalemlik", label: "Kalemlikler", match: /kalemlik/, rules: { uv: min(50, 800, 16), karbon: min(100, 900, 9), lazer: min(100, 900, 9), serigrafi: min(50, 900, 18), ofset: CUSTOM } },
  {
    key: "usb",
    label: "USB bellekler",
    match: /usb|bellek/,
    rules: {
      uv: min(80, 960, 12),
      lazer: min(250, 875, 3.5),
      lazer3d: { kind: "tiers", minFee: 2250, tiers: [{ from: 50, unit: 45 }, { from: 100, unit: 40 }, { from: 250, unit: 33 }, { from: 500, unit: 27 }] },
      gofre: GOFRE,
      domeks: min(100, 1200, 12),
    },
  },
  { key: "powerbank", label: "Powerbank", match: /power ?bank|kablosuz sarj/, rules: { uv: min(50, 1000, 20), lazer: min(70, 840, 12), gofre: GOFRE } },
  { key: "sarj", label: "Şarj cihazları ve kabloları", match: /sarj/, rules: { uv: min(50, 1000, 20), dtf: min(35, 875, 25), lazer: min(70, 840, 12), karbon: min(50, 800, 16) } },
  { key: "speaker", label: "Speaker ve kulaklık", match: /speaker|kulaklik|radyo/, rules: { uv: min(50, 1000, 20), lazer: min(70, 840, 12) } },
  { key: "telefon", label: "Telefon standı, lamba, çoğaltıcı", match: /telefon stand|lamba|cogaltici|selfie/, rules: { uv: min(50, 900, 18), lazer: min(100, 800, 8), karbon: min(80, 960, 12) } },
  { key: "adaptor", label: "Adaptör ve kamera kapatıcı", match: /adaptor|kamera kapat|airtag/, rules: { uv: min(150, 1050, 7), lazer: min(250, 875, 3.5) } },
  { key: "magsafe", label: "Çizim tahtası ve MagSafe kartlık", match: /cizim tahta|magsafe/, rules: { uv: min(70, 900, 15), lazer: min(120, 840, 7) } },
  { key: "kalem", label: "Kalemler ve kalem setleri", match: /kalem/, rules: { uv: min(500, 1000, 2), domeks: min(100, 1200, 12), lazer: min(500, 750, 1.5) } },
  {
    key: "termos",
    label: "Termos bardak ve matara",
    match: /termos (bardak|matara)/,
    rules: { uv: min(40, 1000, 25), dtf: min(40, 1000, 25), serigrafi: min(50, 900, 18), lazer: min(60, 840, 14), karbon: min(50, 1000, 20), ofset: min(20, 840, 42) },
    note: "Metal termoslarda fiber lazer, bambu termoslarda karbon lazer uygulanır.",
  },
  { key: "matara", label: "Plastik ve cam matara", match: /matara|karaf/, rules: { uv: min(50, 1000, 25), dtf: min(50, 1000, 25), serigrafi: min(50, 1000, 20), karbon: min(50, 1000, 20), lazer: min(50, 1000, 20) } },
  { key: "karton-bardak", label: "Karton bardak", match: /karton bardak/, rules: { ofset: INCLUDED, uv: INCLUDED } },
  { key: "bardak-altlik", label: "Bardak altlıkları", match: /bardak altlik/, rules: { uv: min(90, 990, 11), lazer: min(100, 800, 8), gofre: GOFRE, ofset: INCLUDED, sublimasyon: INCLUDED } },
  { key: "bardak", label: "Bardak, fincan, French press", match: /bardak|kupa|fincan|french press/, rules: { sublimasyon: min(5, 475, 95), karbon: min(50, 1000, 20), lazer: min(60, 780, 13), firin: CUSTOM } },
  { key: "anahtarlik", label: "Anahtarlıklar", match: /anahtarlik/, rules: { uv: min(100, 1000, 10), lazer: min(200, 800, 4), serigrafi: min(100, 1000, 10), dokum: INCLUDED, domeks: min(100, 1200, 12), ofset: min(250, 875, 3.5), gofre: GOFRE } },
  { key: "ajanda", label: "Ajanda, organizer, sekreterlik", match: /ajanda|organizer|sekreterlik/, rules: { gofre: GOFRE, serigrafi: min(60, 1020, 17), lazer: min(80, 800, 10), uv: min(40, 920, 23) } },
  { key: "takvim", label: "Takvimler", match: /takvim|masa sumen/, rules: { ofset: CUSTOM } },
  { key: "defter", label: "Defterler", match: /defter/, rules: { gofre: GOFRE, lazer: min(80, 800, 10), uv: min(40, 920, 23), karbon: min(60, 900, 15), ofset: CUSTOM } },
  { key: "kup-bloknot", label: "Küp bloknot", match: /kup bloknot/, rules: { uv: min(50, 850, 17), karbon: min(75, 900, 12), lazer: min(75, 900, 12), ofset: CUSTOM } },
  { key: "bloknot", label: "Bloknot", match: /bloknot/, rules: { ofset: CUSTOM } },
  { key: "manikur", label: "Manikür seti ve ayna", match: /manikur|ayna/, rules: { uv: min(70, 980, 14), lazer: min(100, 750, 7.5), gofre: GOFRE } },
  { key: "yagmurluk", label: "Yağmurluk", match: /yagmurluk/, rules: { serigrafi: min(100, 1300, 13) } },
  {
    key: "saat",
    label: "Saatler",
    match: /saat/,
    rules: {
      ofset: {
        kind: "tiers",
        minFee: 0,
        tiers: [
          { from: 30, unit: 75 }, { from: 51, unit: 63 }, { from: 61, unit: 50 }, { from: 81, unit: 44 }, { from: 101, unit: 38 }, { from: 151, unit: 30 },
          { from: 201, unit: 23 }, { from: 251, unit: 17 }, { from: 301, unit: 14 }, { from: 401, unit: 10 }, { from: 501, unit: 9 }, { from: 601, unit: 7.5 },
          { from: 701, unit: 6.5 }, { from: 801, unit: 5.75 }, { from: 901, unit: 4.5 }, { from: 1001, unit: 3.75 }, { from: 1501, unit: 3.1 },
        ],
      },
      serigrafi: min(100, 1800, 18),
      uv: min(25, 950, 38),
      lazer: min(70, 875, 12.5),
      lazer3d: INCLUDED,
    },
    note: "Karton kadranlı saatlerde ofset baskı en az 30 adettir; kristal masa saatlerinde UV baskı 40 adede kadar 920 TL, üzeri 23 TL.",
  },
  { key: "kartvizitlik", label: "Kartvizitlikler", match: /kartvizit/, rules: { uv: min(50, 900, 18), lazer: min(100, 800, 8) } },
  { key: "masa-seti", label: "Masa setleri ve isimlik", match: /masa set|ofis set|isimlik/, rules: { uv: min(45, 990, 22), lazer: min(100, 900, 9), serigrafi: min(80, 1200, 15) } },
  { key: "ozel-set", label: "Kutulu özel setler ve set kutuları", match: /ozel set|set kutu/, rules: { uv: min(20, 900, 45), lazer: min(60, 810, 13.5), gofre: GOFRE }, note: "Set içindeki ürünlere kendi baskı fiyatları uygulanır; bu fiyat kutu baskısıdır." },
  { key: "caki", label: "Çakı, fener, metre", match: /caki|fener|metre|makas|pense/, rules: { uv: min(70, 980, 14), lazer: min(100, 800, 8) } },
  { key: "rozet", label: "Rozetler", match: /rozet/, rules: { uv: min(80, 960, 12), ofset: INCLUDED, domeks: INCLUDED } },
  { key: "mousepad", label: "Mouse pad", match: /mouse ?pad/, rules: { ofset: INCLUDED, uv: INCLUDED, sublimasyon: INCLUDED } },
  { key: "magnet-acacakli", label: "Açacaklı magnet", match: /acacakli magnet/, rules: { uv: min(100, 1000, 10) } },
  { key: "magnet", label: "Magnetler", match: /magnet/, rules: { uv: INCLUDED, ofset: INCLUDED } },
  {
    key: "para-tabagi",
    label: "Para tabakları",
    match: /para tabak/,
    rules: { ofset: { kind: "tiers", minFee: 800, tiers: [{ from: 50, unit: 16 }, { from: 101, unit: 14 }, { from: 201, unit: 12.5 }, { from: 501, unit: 10 }, { from: 1001, unit: 7.5 }] } },
  },
  { key: "hesap-makinesi", label: "Hesap makinesi", match: /hesap makine/, rules: { uv: min(90, 990, 11), lazer: min(100, 800, 8) } },
  { key: "cakmak", label: "Çakmaklar", match: /cakmak/, rules: { uv: min(500, 1150, 2.3) } },
  { key: "kibrit", label: "Kibrit", match: /kibrit/, rules: { ofset: CUSTOM } },
  { key: "dis-fircasi", label: "Diş fırçası", match: /dis firca/, rules: { ofset: INCLUDED } },
  { key: "kul-tablasi", label: "Kül tablası", match: /kul tabla|kullu/, rules: { dtf: min(50, 900, 18), serigrafi: min(100, 1400, 14) } },
  { key: "not-tutucu", label: "Not tutucu", match: /not tutucu/, rules: { uv: min(100, 1000, 10) } },
  { key: "sertifika", label: "Sertifika ve menü kapları", match: /sertifika|menu/, rules: { uv: min(50, 1000, 20), lazer: min(100, 800, 8) } },
  { key: "post-it", label: "Post-it", match: /post it/, rules: { lazer: min(100, 800, 8), uv: min(60, 1020, 17) } },
  { key: "geri-donusum", label: "Geri dönüşümlü ürünler", match: /geri donusum/, rules: { uv: min(50, 1000, 20), serigrafi: min(100, 1500, 15) } },
  {
    key: "sapka",
    label: "Şapka",
    match: /sapka/,
    rules: {
      nakis: min(100, 1600, 16),
      transfer: { kind: "tiers", minFee: 1000, tiers: [{ from: 1, unit: 10 }, { from: 251, unit: 8.5 }, { from: 501, unit: 8 }, { from: 1001, unit: 7.5 }] },
      dtf: { kind: "tiers", minFee: 1600, tiers: [{ from: 1, unit: 16 }, { from: 251, unit: 15 }, { from: 501, unit: 14 }, { from: 1001, unit: 12.5 }] },
    },
  },
  { key: "tekstil", label: "Tekstil", match: /boyunluk|bere|atki|battaniye|onluk|sal\b|tisort|sweat|mont|yelek/, rules: { nakis: CUSTOM, transfer: CUSTOM, serigrafi: CUSTOM, dtf: CUSTOM } },
  { key: "oto-kokusu", label: "Oto kokusu", match: /araba koku/, rules: { ofset: INCLUDED, uv: INCLUDED } },
  { key: "gunesli", label: "Güneşlik", match: /gunesli/, rules: { serigrafi: CUSTOM, uv: CUSTOM } },
  { key: "ruhsat", label: "Ruhsatlık", match: /ruhsat/, rules: { gofre: GOFRE, uv: min(100, 1000, 10) } },
  { key: "bez-canta", label: "Bez çantalar", match: /bez canta/, rules: { serigrafi: INCLUDED, transfer: INCLUDED, dtf: INCLUDED } },
  { key: "karton-canta", label: "Karton çantalar", match: /karton canta/, rules: { ofset: CUSTOM, serigrafi: CUSTOM } },
  { key: "canta", label: "Çantalar", match: /canta/, rules: { dtf: min(50, 950, 19), lazer: min(100, 800, 8), transfer: CUSTOM, nakis: CUSTOM } },
  { key: "okul-seti", label: "Okul ve sınav setleri", match: /sinav set|okul set/, rules: { uv: min(80, 1100, 12), serigrafi: min(100, 1200, 12) } },
  { key: "boyama", label: "Boyama setleri", match: /boyama/, rules: { uv: min(80, 960, 12) } },
  { key: "yelpaze", label: "Yelpaze", match: /yelpaze/, rules: { ofset: INCLUDED, uv: INCLUDED } },
  { key: "frizbi", label: "Frizbi", match: /frizbi/, rules: { dtf: min(50, 900, 18), uv: min(50, 900, 18) } },
  { key: "bavul", label: "Bavul etiketi", match: /bavul/, rules: { lazer: min(100, 750, 7.5) } },
  { key: "pasaport", label: "Pasaport kılıfı", match: /pasaport/, rules: { uv: min(80, 960, 12), gofre: GOFRE, serigrafi: CUSTOM } },
  { key: "seker", label: "Şeker ve çikolata", match: /seker|cikolata/, rules: { ofset: INCLUDED, uv: INCLUDED } },
  { key: "semsiye", label: "Şemsiye", match: /semsiye/, rules: { serigrafi: min(50, 1250, 25) }, note: "Fiyat tek dilim, tek renk içindir." },
  { key: "bitki", label: "Bitki yetiştirme kitleri", match: /bitki/, rules: { lazer: min(100, 800, 8), uv: min(50, 950, 19), serigrafi: CUSTOM } },
  { key: "madalya", label: "Madalya", match: /madalya/, rules: { lazer: min(100, 800, 8), uv: min(80, 960, 12) } },
  { key: "plaket", label: "Plaket ve kristal", match: /plaket|kristal/, rules: { uv: min(8, 880, 110), sublimasyon: min(8, 800, 100), karbon: min(50, 900, 18), lazer: min(50, 900, 18), lazer3d: INCLUDED } },
  { key: "bayrak", label: "Bayraklar", match: /bayrak/, rules: { uv: INCLUDED, dtf: INCLUDED, sublimasyon: INCLUDED } },
];

const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/&/g, " ")
    .replace(/\s+/g, " ");

export function printGroupOf(subcategory: string | null | undefined, name = ""): Group | null {
  const t = norm(`${subcategory ?? ""}`);
  return PRINT_GROUPS.find((g) => g.match.test(t)) ?? (name ? PRINT_GROUPS.find((g) => g.match.test(norm(name))) ?? null : null);
}

/** XML'deki baskı adı → yöntem anahtar(lar)ı; ilk bulunan kural kullanılır */
export function methodKeys(method: string): MethodKey[] {
  const m = norm(method);
  if (/3d|uc boyut/.test(m)) return ["lazer3d", "lazer"];
  if (/karbon/.test(m)) return ["karbon", "lazer"];
  if (/lazer/.test(m)) return ["lazer", "karbon"];
  if (/dtf uv/.test(m)) return ["uv", "dtf"];
  if (/dtf/.test(m)) return ["dtf", "uv"];
  if (/uv|dijital/.test(m)) return ["uv", "dtf"];
  if (/serigraf|tampon/.test(m)) return ["serigrafi"];
  if (/ofset/.test(m)) return ["ofset"];
  if (/gofre|sicak|folyo/.test(m)) return ["gofre"];
  if (/domeks/.test(m)) return ["domeks"];
  if (/sublim/.test(m)) return ["sublimasyon"];
  if (/transfer/.test(m)) return ["transfer"];
  if (/nakis/.test(m)) return ["nakis"];
  if (/firin/.test(m)) return ["firin"];
  if (/dokum/.test(m)) return ["dokum"];
  return [];
}

export type PrintQuote =
  | { kind: "price"; total: number; perUnit: number; rule: PrintRule; note?: string }
  | { kind: "included"; note?: string }
  | { kind: "custom"; note?: string };

function ruleTotal(rule: Exclude<PrintRule, { kind: "included" | "custom" }>, qty: number): number {
  if (rule.kind === "min") return qty <= rule.upto ? rule.fixed : qty * rule.unit;
  if (rule.kind === "gofre") {
    const klise = 950;
    if (qty <= 100) return klise + 1300;
    const unit = qty < 500 ? 13 : qty < 1000 ? 11 : 9;
    return klise + qty * unit;
  }
  const tier = [...rule.tiers].reverse().find((t) => qty >= t.from) ?? rule.tiers[0];
  return Math.max(rule.minFee, qty * tier.unit);
}

/**
 * Bir ürün grubunda, verilen baskı yöntemiyle `qty` adet için tedarikçi baskı bedeli (KDV hariç, tek taraf).
 * `markupPct` ile satış fiyatına çevrilir.
 */
export function quotePrint(subcategory: string | null | undefined, name: string, method: string, qty: number, markupPct = 0): PrintQuote {
  const g = printGroupOf(subcategory, name);
  const rule = g ? methodKeys(method).map((k) => g.rules[k]).find(Boolean) : undefined;
  if (!rule || rule.kind === "custom") return { kind: "custom", note: g?.note };
  if (rule.kind === "included") return { kind: "included", note: g?.note };
  const q = Math.max(1, Math.round(qty));
  const total = Math.round(ruleTotal(rule, q) * (1 + markupPct / 100) * 100) / 100;
  return { kind: "price", total, perUnit: Math.round((total / q) * 100) / 100, rule, note: g?.note };
}

/** Kuralın kısa, okunur açıklaması (ürün sayfası için) */
export function describeRule(rule: PrintRule, markupPct = 0): string {
  const k = 1 + markupPct / 100;
  const tl = (n: number) => `${(Math.round(n * k * 100) / 100).toLocaleString("tr-TR")} TL`;
  if (rule.kind === "min") return `${rule.upto} adede kadar sabit ${tl(rule.fixed)}, üzeri adet başı ${tl(rule.unit)}`;
  if (rule.kind === "gofre") return `Klişe ${tl(950)} + 100 adede kadar ${tl(1300)}; sonra adet başı ${tl(13)} / ${tl(11)} / ${tl(9)}`;
  if (rule.kind === "tiers") return `${rule.minFee ? `en az ${tl(rule.minFee)}, ` : ""}adet başı ${tl(rule.tiers[0].unit)}'den ${tl(rule.tiers[rule.tiers.length - 1].unit)}'ye`;
  return rule.kind === "included" ? "Baskı fiyata dahil" : "Teklifte bildirilir";
}
