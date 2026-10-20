import type { z } from "zod";
import type { QuoteContactSchema } from "../quote/schema";
import type { OdemeixStatus } from "./odemeix";
import type { PricedLine } from "./orderPricing";

export type OrderStatus = "awaiting_payment" | "processing" | "paid" | "failed" | "refunded" | "canceled" | "expired";
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: "Ödeme bekleniyor",
  processing: "Ödeme işleniyor",
  paid: "Ödendi",
  failed: "Ödeme başarısız",
  refunded: "İade edildi",
  canceled: "İptal edildi",
  expired: "Süresi doldu",
};

export type Order = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  contact: z.infer<typeof QuoteContactSchema>;
  lines: PricedLine[];
  net: number;
  vat: number;
  amount: number; // ödeme sistemine gönderilen KDV dahil tutar
  paidTotal: number | null; // karttan çekilen (komisyon müşteriye yansıdıysa daha büyük)
  sessionToken: string | null;
  paymentUrl: string | null;
  testMode: boolean;
  processedEvents: number[];
  history: { at: string; status: OrderStatus; source: "checkout" | "webhook" | "status" | "admin"; note?: string }[];
};

const MAP: Record<OdemeixStatus, OrderStatus> = {
  pending: "awaiting_payment",
  processing: "processing",
  succeeded: "paid",
  failed: "failed",
  refunded: "refunded",
  canceled: "canceled",
  expired: "expired",
};

/**
 * Ödeme durumunu siparişe uygular. Ödenmiş sipariş, gecikmeli gelen eski bir "başarısız/süresi doldu"
 * bildirimiyle geri alınmaz; yalnız iade ödenmiş siparişi değiştirebilir.
 */
export function applyPaymentStatus(o: Order, s: OdemeixStatus, source: Order["history"][number]["source"], extra: { paidTotal?: number | null; token?: string; note?: string } = {}): boolean {
  const next = MAP[s];
  if (!next || next === o.status) {
    if (extra.paidTotal != null) o.paidTotal = extra.paidTotal;
    return false;
  }
  const settled = o.status === "paid" || o.status === "refunded";
  if (settled && next !== "refunded") return false;
  o.status = next;
  if (extra.paidTotal != null) o.paidTotal = extra.paidTotal;
  if (extra.token) o.sessionToken = extra.token;
  o.history.push({ at: new Date().toISOString(), status: next, source, note: extra.note });
  return true;
}
