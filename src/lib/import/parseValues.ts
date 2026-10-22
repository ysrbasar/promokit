/** Kaynak metinlerden sayı/stok/fiyat ayrıştırma — Türkçe biçimlere duyarlı. */

/**
 * Stok değeri:
 *  - boş, "-", "?", "bilinmiyor", "sorunuz" → null (BİLİNMİYOR; sıfır değildir)
 *  - "yok", "tükendi", "stokta yok" → 0
 *  - "1.250", "1,250", "1250 adet", ">500", "500+" → sayı (alt sınır)
 */
export function parseStock(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = raw.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
  if (!s || /^[-–—?.]+$/.test(s)) return null;
  if (/(bilinmiyor|sorunuz|sorunuz|teyit|bilgi alınız|bilgi aliniz|tedarik)/.test(s)) return null;
  if (/(stokta yok|tükendi|tukendi|yok\b|^0+$|kalmadı|kalmadi)/.test(s)) return 0;
  const n = parseNumber(s);
  return n === null ? null : Math.max(0, Math.floor(n));
}

/** "1.250,50" → 1250.5 ; "1,250" → 1250 ; "1250.5" → 1250.5 */
export function parseNumber(raw: string): number | null {
  const m = raw.match(/\d[\d.,\s]*/);
  if (!m) return null;
  let t = m[0].replace(/\s/g, "");
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, "");
  else if (/^\d+,\d{1,2}$/.test(t)) t = t.replace(",", ".");
  else t = t.replace(/[.,](?=.*[.,])/g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function parsePrice(raw: string | null | undefined): { amount: number; currency: string } | null {
  if (!raw) return null;
  const n = parseNumber(raw);
  if (n === null || n <= 0) return null;
  const currency = /\$|usd/i.test(raw) ? "USD" : /€|eur/i.test(raw) ? "EUR" : "TRY";
  return { amount: n, currency };
}

export function cleanText(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.replace(/\s+/g, " ").trim();
  return t || null;
}
