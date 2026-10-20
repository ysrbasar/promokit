import { NextResponse } from "next/server";
import { z } from "zod";
import { OdemeixError, createPaymentSession, isTestMode, paymentsEnabled } from "@/lib/payment/odemeix";
import { priceCart } from "@/lib/payment/orderPricing";
import { QuoteContactSchema } from "@/lib/quote/schema";
import { newOrderId, saveOrder, type Order } from "@/lib/server/orders";
import { getCatalog } from "@/lib/server/repositories";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const Body = z.object({
  contact: QuoteContactSchema,
  items: z.array(z.object({ productCode: z.string().max(40), variantCode: z.string().max(80).nullable(), qty: z.number().int().min(1).max(100000) })).min(1).max(50),
});

/** POST /api/checkout — sepetten sipariş oluşturur ve Ödemeix ödeme sayfası bağlantısını döner */
export async function POST(req: Request) {
  if (!paymentsEnabled()) return NextResponse.json({ error: "Online ödeme henüz etkin değil. Sipariş talebi gönderebilirsiniz." }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return NextResponse.json({ error: "Lütfen işaretli alanları kontrol edin", fieldErrors }, { status: 422 });
  }
  const { products } = await getCatalog();
  const priced = priceCart(parsed.data.items, products);
  if (priced.problems.length) return NextResponse.json({ error: priced.problems.join(" ") }, { status: 422 });

  const now = new Date().toISOString();
  const order: Order = {
    id: newOrderId(),
    createdAt: now,
    updatedAt: now,
    status: "awaiting_payment",
    contact: parsed.data.contact,
    lines: priced.lines,
    net: priced.net,
    vat: priced.vat,
    amount: priced.gross,
    paidTotal: null,
    sessionToken: null,
    paymentUrl: null,
    testMode: isTestMode(),
    processedEvents: [],
    history: [{ at: now, status: "awaiting_payment", source: "checkout" }],
  };
  await saveOrder(order);

  try {
    const back = `${SITE_URL}/odeme/sonuc?siparis=${order.id}`;
    const s = await createPaymentSession(
      {
        amount: order.amount,
        customerReference: order.id,
        customerName: order.contact.fullName,
        customerEmail: order.contact.email,
        customerPhone: order.contact.phone,
        successUrl: back,
        cancelUrl: `${back}&durum=iptal`,
        metadata: { company: order.contact.company.slice(0, 100), city: order.contact.city.slice(0, 60) },
      },
      `${order.id}-odeme-1`,
    );
    order.sessionToken = s.public_token;
    order.paymentUrl = s.hosted_payment_url;
    await saveOrder(order);
    return NextResponse.json({ orderId: order.id, paymentUrl: s.hosted_payment_url }, { status: 201 });
  } catch (e) {
    const msg = e instanceof OdemeixError ? e.message : "Ödeme sistemine ulaşılamadı.";
    order.history.push({ at: new Date().toISOString(), status: order.status, source: "checkout", note: `Oturum açılamadı: ${msg}` });
    await saveOrder(order);
    console.error("[odemeix] oturum açılamadı", order.id, e);
    return NextResponse.json({ error: `Ödeme başlatılamadı: ${msg} Lütfen biraz sonra tekrar deneyin veya sipariş talebi gönderin.` }, { status: 502 });
  }
}
