"use client";

/**
 * Sihirbazda seçilen logo dosyası, teklif formuna aktarılmak üzere yalnızca bellekte tutulur
 * (localStorage'a dosya yazılmaz). Sayfa yenilenirse teklif formunda yeniden yüklenmesi gerekir.
 */
let logo: File | null = null;

export const LOGO_ACCEPT = ".png,.jpg,.jpeg,.svg,.pdf";
export const LOGO_MAX = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/svg+xml", "application/pdf"];

export function validateLogo(f: File): string | null {
  if (!TYPES.includes(f.type)) return "Yalnızca PNG, JPG, SVG veya PDF yükleyebilirsiniz.";
  if (f.size > LOGO_MAX) return "Dosya en fazla 5 MB olabilir.";
  return null;
}

export const setLogo = (f: File | null) => {
  logo = f;
};
export const getLogo = () => logo;
