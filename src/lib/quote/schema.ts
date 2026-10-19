import { z } from "zod";
import { KitLineSchema } from "../kit/kitState";

const phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s()-]/g, ""))
  .refine((s) => /^\+?\d{10,14}$/.test(s), "Geçerli bir telefon numarası girin");

export const QuoteContactSchema = z.object({
  company: z.string().trim().min(2, "Firma adı gerekli").max(120),
  fullName: z.string().trim().min(3, "Ad soyad gerekli").max(80),
  email: z.string().trim().email("Geçerli bir e-posta adresi girin").max(120),
  phone,
  city: z.string().trim().min(2, "Teslimat şehri gerekli").max(60),
  deliveryDate: z
    .string()
    .trim()
    .optional()
    .transform((s) => (s ? s : null))
    .refine((s) => s === null || /^\d{4}-\d{2}-\d{2}$/.test(s), "Tarih biçimi geçersiz"),
  notes: z.string().trim().max(2000).optional().default(""),
  kvkkConsent: z.literal(true, { errorMap: () => ({ message: "Aydınlatma metnini onaylamanız gerekiyor" }) }),
  marketingConsent: z.boolean().optional().default(false),
});

export const QuoteKitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kitQuantity: z.number().int().min(1, "Kit adedi en az 1 olmalı").max(100000),
  lines: z.array(KitLineSchema).min(1, "Kitte en az bir ürün olmalı").max(30),
  source: z.enum(["wizard", "free", "ready", "cart"]),
  readyKitSlug: z.string().nullable().optional(),
  answers: z.record(z.unknown()).nullable().optional(),
});

export const QuoteRequestSchema = z.object({
  contact: QuoteContactSchema,
  kit: QuoteKitSchema,
});
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

export const QUOTE_STATUSES = ["new", "reviewing", "quoted", "won", "lost"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  new: "Yeni",
  reviewing: "İnceleniyor",
  quoted: "Teklif gönderildi",
  won: "Kazanıldı",
  lost: "Kaybedildi",
};

export type StoredQuote = QuoteRequest & {
  id: string;
  createdAt: string;
  status: QuoteStatus;
  /** Talep anında ürünlerin kod, ad, varyant ve stok durumunun anlık görüntüsü */
  snapshot: {
    productCode: string;
    name: string;
    variantCode: string | null;
    color: string | null;
    qty: number;
    stockStatus: string;
    /** Talep anındaki liste fiyatı (KDV hariç) */
    listPrice?: number | null;
    /** Talep anındaki alış fiyatı — yalnız yönetim paneli */
    cost?: number | null;
    currency?: string | null;
    /** Logo baskısı: yöntem, müşteriye fiyat (kâr paylı) ve tedarikçi bedeli — toplam tutarlar */
    printMethod?: string | null;
    printPrice?: number | null;
    printCost?: number | null;
  }[];
  attachment: { fileName: string; storedAs: string; size: number; type: string } | null;
  catalogKind: "import" | "demo";
};

export const UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;
export const UPLOAD_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

/** Dosya içeriğinin bildirilen türle uyuştuğunu sihirli baytlarla doğrular */
export function sniffFileType(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  const head = new TextDecoder().decode(b.slice(0, 512)).trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "image/svg+xml";
  return null;
}
