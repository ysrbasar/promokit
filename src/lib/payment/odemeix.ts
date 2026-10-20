import "server-only";

/**
 * Ödemeix API istemcisi (Ortak Ödeme Sayfası akışı).
 * Kart bilgisi bu sunucudan hiç geçmez: oturum açılır, müşteri hosted_payment_url'e yönlendirilir,
 * kesin sonuç imzalı webhook ve durum sorgusuyla gelir. Anahtarlar yalnız .env'de tutulur.
 *   ODEMEIX_SECRET_KEY      sk_test_… / sk_live_…
 *   ODEMEIX_WEBHOOK_SECRET  whsec_…
 *   ODEMEIX_BASE_URL        varsayılan https://portal.odemeix.com/api
 */

export type OdemeixStatus = "pending" | "processing" | "succeeded" | "failed" | "refunded" | "canceled" | "expired";

export const odemeixConfig = () => ({
  baseUrl: (process.env.ODEMEIX_BASE_URL || "https://portal.odemeix.com/api").replace(/\/$/, ""),
  secretKey: process.env.ODEMEIX_SECRET_KEY ?? "",
  webhookSecret: process.env.ODEMEIX_WEBHOOK_SECRET ?? "",
});

export const paymentsEnabled = () => /^sk_(test|live)_/.test(odemeixConfig().secretKey);
export const isTestMode = () => odemeixConfig().secretKey.startsWith("sk_test_");

export class OdemeixError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown, opts: { auth?: boolean; idempotencyKey?: string } = {}): Promise<T> {
  const { baseUrl, secretKey } = odemeixConfig();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth !== false) headers.Authorization = `Bearer ${secretKey}`;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const r = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal, cache: "no-store" });
    const data = (await r.json().catch(() => ({}))) as T & { message?: string; code?: string };
    if (!r.ok) throw new OdemeixError(data.message || `Ödeme sistemi hatası (HTTP ${r.status})`, r.status, data.code);
    return data;
  } finally {
    clearTimeout(t);
  }
}

export type CreateSessionInput = {
  amount: number;
  customerReference: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};
export type SessionResponse = { public_token: string; status: OdemeixStatus; hosted_payment_url: string; expires_at: string; amount: number };

/** POST /v1/payment-sessions — aynı sipariş için tekrar gönderimde ikinci oturum açılmaz (Idempotency-Key) */
export function createPaymentSession(input: CreateSessionInput, idempotencyKey: string) {
  return call<SessionResponse>(
    "POST",
    "/v1/payment-sessions",
    {
      amount: Math.round(input.amount * 100) / 100,
      currency: "TRY",
      customer_reference: input.customerReference,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      expires_in_minutes: 120,
      metadata: input.metadata,
    },
    { idempotencyKey },
  );
}

export type StatusResponse = { status: OdemeixStatus; status_label: string; paid: boolean; amount: number; paid_total: number | null; refund_state?: string };

/** GET /v1/payment-sessions/{token}/status — kimlik gerektirmez */
export const getPaymentStatus = (token: string) => call<StatusResponse>("GET", `/v1/payment-sessions/${encodeURIComponent(token)}/status`, undefined, { auth: false });

/** GET /v1/payment-sessions/by-reference/{ref} — müşteri "Tekrar dene" dediyse en son oturum latest'tadır */
export const getByReference = (ref: string) =>
  call<{ latest: { token: string; status: OdemeixStatus; amount: number; paid_total?: number | null } | null }>("GET", `/v1/payment-sessions/by-reference/${encodeURIComponent(ref)}`);

/** POST /v1/payment-sessions/{token}/refund — tutar verilmezse tam iade */
export const refundPayment = (token: string, idempotencyKey: string, amount?: number) =>
  call<{ message?: string }>("POST", `/v1/payment-sessions/${encodeURIComponent(token)}/refund`, amount ? { amount } : {}, { idempotencyKey });
