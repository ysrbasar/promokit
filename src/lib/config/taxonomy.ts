/**
 * Katalog taksonomisi ve sihirbaz seçenekleri tek yerde tanımlanır.
 * Ürün kategorileri, amaçlar, hedef kitleler ve stiller buradaki anahtarlarla eşleşir.
 */

export type Option = { key: string; label: string; hint?: string };

export const CATEGORIES = [
  { key: "termos-matara", label: "Termos ve Mataralar", hint: "Sıcak ve soğuk içecek" },
  { key: "defter-ajanda", label: "Defter ve Ajandalar", hint: "Yazı ve planlama" },
  { key: "kalem", label: "Kalemler", hint: "Metal, roller, set" },
  { key: "canta", label: "Çantalar", hint: "Sırt, laptop, bez" },
  { key: "teknoloji", label: "Teknoloji Ürünleri", hint: "Powerbank, şarj, ses" },
  { key: "tekstil", label: "Tekstil Ürünleri", hint: "Tişört, polar, şapka" },
  { key: "kupa-bardak", label: "Kupa ve Bardaklar", hint: "Seramik, cam, çelik" },
  { key: "masaustu", label: "Masaüstü Aksesuarları", hint: "Masa düzeni" },
  { key: "hediye-set", label: "Hediyelik Setler", hint: "Hazır kombinasyonlar" },
  { key: "kutu-ambalaj", label: "Kutular ve Ambalajlar", hint: "Sunum ve paket" },
  { key: "doga-dostu", label: "Doğa Dostu Ürünler", hint: "Bambu, geri dönüşüm" },
  { key: "diger", label: "Diğer Ürünler", hint: "Sınıflandırılmamış" },
] as const satisfies readonly Option[];

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

/** Sihirbazda seçilebilen ürün grupları ("Diğer" hariç) */
export const WIZARD_CATEGORIES = CATEGORIES.filter((c) => c.key !== "diger");

export const PURPOSES: Option[] = [
  { key: "welcome", label: "Yeni çalışan karşılama", hint: "İlk gün deneyimi" },
  { key: "client", label: "Müşteri hediyesi", hint: "İlişkiyi güçlendirin" },
  { key: "dealer", label: "Bayi hediyesi", hint: "İş ortaklığına teşekkür" },
  { key: "event", label: "Etkinlik ve fuar", hint: "Toplu dağıtım" },
  { key: "vip", label: "Yönetici ve VIP hediyesi", hint: "Seçkin bir jest" },
  { key: "education", label: "Öğrenci ve eğitim", hint: "Kampüs ve eğitim" },
  { key: "seasonal", label: "Yılbaşı ve özel gün", hint: "Kutlama kitleri" },
  { key: "other", label: "Diğer", hint: "Size özel senaryo" },
];

export const AUDIENCES: Option[] = [
  { key: "employees", label: "Çalışanlar" },
  { key: "clients", label: "Müşteriler" },
  { key: "partners", label: "İş ortakları" },
  { key: "executives", label: "Yöneticiler" },
  { key: "students", label: "Öğrenciler" },
  { key: "attendees", label: "Etkinlik katılımcıları" },
  { key: "general", label: "Genel dağıtım" },
];

export const QUANTITY_RANGES = [
  { key: "10-25", label: "10–25", value: 25 },
  { key: "26-50", label: "26–50", value: 50 },
  { key: "51-100", label: "51–100", value: 100 },
  { key: "101-250", label: "101–250", value: 250 },
  { key: "251-500", label: "251–500", value: 500 },
  { key: "500+", label: "500+", value: 750 },
];

export const STYLES: Option[] = [
  { key: "minimal", label: "Minimal ve modern" },
  { key: "luxury", label: "Premium ve lüks" },
  { key: "tech", label: "Teknolojik" },
  { key: "eco", label: "Doğa dostu" },
  { key: "dynamic", label: "Genç ve dinamik" },
  { key: "classic", label: "Geleneksel ve kurumsal" },
  { key: "creative", label: "Renkli ve yaratıcı" },
];

export const PERSONALIZATION: Option[] = [
  { key: "logo-print", label: "Logo baskısı" },
  { key: "laser", label: "Lazer kazıma" },
  { key: "custom-color", label: "Özel renk seçimi" },
  { key: "custom-box", label: "Özel kutu ve ambalaj" },
  { key: "card", label: "Kart veya mesaj ekleme" },
  { key: "later", label: "Baskı seçeneklerini sonradan belirleyeceğim" },
];

export const TIMINGS: Option[] = [
  { key: "urgent", label: "Acil", hint: "Tedarik onayıyla" },
  { key: "1-2w", label: "1–2 hafta" },
  { key: "2-4w", label: "2–4 hafta" },
  { key: "flexible", label: "Esnek tarih" },
];

/** Baskı yöntemleri (ürün verisindeki printingMethods ile eşleşir) → kişiselleştirme anahtarı */
export const PRINTING_TO_PERSONALIZATION: Record<string, string> = {
  "Tampon baskı": "logo-print",
  "Serigrafi": "logo-print",
  "UV baskı": "logo-print",
  "Dijital baskı": "logo-print",
  "Transfer baskı": "logo-print",
  "Nakış": "logo-print",
  "Lazer kazıma": "laser",
  "Kabartma": "laser",
};

export function labelOf(list: readonly Option[], key: string | null | undefined) {
  return list.find((o) => o.key === key)?.label ?? key ?? "";
}

export function categoryLabel(key: string) {
  return labelOf(CATEGORIES, key);
}
