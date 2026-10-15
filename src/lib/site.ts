export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Şirket bilgileri ortam değişkenlerinden gelir; tanımlı değilse arayüz bunu açıkça belirtir */
export const COMPANY = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || null,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || null,
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || null,
};
