"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { QuoteContactSchema, QuoteRequestSchema } from "@/lib/quote/schema";
import { LOGO_ACCEPT, getLogo, setLogo, validateLogo } from "@/lib/kit/logoStore";
import { useKit, useHydrated } from "@/lib/kit/store";
import { useCart } from "@/lib/cart/store";
import { CartList } from "../cart/CartList";
import { KitWorkspace } from "../kit/KitWorkspace";
import { EASE } from "../ui/motion";
import { Button, ButtonLink, Icon, Skeleton, cn } from "../ui/primitives";

type Errors = Record<string, string>;

/** mode="cart": sepetteki tekli ürünler sipariş talebi olarak gönderilir (kit yerine) */
export function QuoteFlow({ mode = "kit", paymentsEnabled = false }: { mode?: "kit" | "cart"; paymentsEnabled?: boolean }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const kitDraft = useKit((s) => s.draft);
  const saveCurrent = useKit((s) => s.saveCurrent);
  const cartItems = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const isCart = mode === "cart";
  const draft = isCart
    ? {
        name: "Sepet siparişi",
        kitQuantity: 1,
        source: "cart" as const,
        readyKitSlug: null,
        answers: null as Record<string, unknown> | null,
        lines: cartItems.map((i) => ({ productCode: i.productCode, variantCode: i.variantCode, qty: i.qty, personalization: [] as string[] })),
      }
    : kitDraft;
  const [step, setStep] = useState<1 | 2>(1);
  const [salesConsent, setSalesConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(() => getLogo());
  const [form, setForm] = useState({
    company: "",
    fullName: "",
    email: "",
    phone: "",
    city: "",
    deliveryDate: typeof draft.answers?.deliveryDate === "string" ? (draft.answers.deliveryDate as string) : "",
    notes: "",
    kvkkConsent: false,
    marketingConsent: false,
  });

  if (!hydrated) return <Skeleton className="h-[480px]" />;

  if (draft.lines.length === 0 && isCart) return <CartList />;
  if (draft.lines.length === 0)
    return (
      <div className="rounded-card border border-dashed border-line-strong p-12 text-center">
        <p className="font-display text-3xl">Teklif için önce bir kit oluşturun</p>
        <p className="mt-2 text-sm text-muted">Sorularla öneri alın, hazır bir kit seçin ya da katalogdan ürün ekleyin.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/kit-olustur">Kit oluştur</ButtonLink>
          <ButtonLink href="/hazir-kitler" variant="outline">
            Hazır kitler
          </ButtonLink>
        </div>
      </div>
    );

  const missingVariant = draft.lines.some((l) => !l.variantCode);
  const field = (k: keyof typeof form) => ({
    id: `f-${k}`,
    name: k,
    value: form[k] as string,
    "aria-invalid": !!errors[`contact.${k}`] || undefined,
    "aria-describedby": errors[`contact.${k}`] ? `e-${k}` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  /** Sepet: Ödemeix ödeme sayfasına yönlendirir (tutar sunucuda katalog fiyatından hesaplanır) */
  const pay = async () => {
    setFormError(null);
    if (!salesConsent) {
      setFormError("Kartla ödeme için ön bilgilendirme ve mesafeli satış sözleşmesini onaylamanız gerekiyor.");
      return;
    }
    const parsed = QuoteContactSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const i of parsed.error.issues) errs[`contact.${i.path.join(".")}`] ??= i.message;
      setErrors(errs);
      setFormError("Lütfen işaretli alanları kontrol edin.");
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: form, items: cartItems }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.paymentUrl) {
        setFormError(d.error ?? "Ödeme başlatılamadı. Lütfen tekrar deneyin.");
        return;
      }
      window.location.href = d.paymentUrl;
    } catch {
      setFormError("Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      contact: form,
      kit: {
        name: draft.name,
        kitQuantity: draft.kitQuantity,
        lines: draft.lines,
        source: draft.source,
        readyKitSlug: draft.readyKitSlug,
        answers: draft.answers,
      },
    };
    const parsed = QuoteRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const i of parsed.error.issues) errs[i.path.join(".")] ??= i.message;
      setErrors(errs);
      setFormError("Lütfen işaretli alanları kontrol edin.");
      document.getElementById(`f-${Object.keys(errs)[0]?.split(".")[1]}`)?.focus();
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const fd = new FormData();
      fd.set("payload", JSON.stringify(payload));
      if (file) fd.set("attachment", file);
      const r = await fetch("/api/quotes", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErrors(d.fieldErrors ?? {});
        setFormError(d.error ?? "Talebiniz gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }
      if (isCart) clearCart();
      else saveCurrent();
      setLogo(null);
      router.push(`/teklif/basarili?no=${encodeURIComponent(d.id)}`);
    } catch {
      setFormError("Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSending(false);
    }
  };

  const err = (k: string) =>
    errors[`contact.${k}`] ? (
      <p id={`e-${k}`} className="mt-1.5 text-xs text-danger">
        {errors[`contact.${k}`]}
      </p>
    ) : null;
  const inputCls = (k: string) =>
    cn("h-12 w-full rounded-soft border bg-paper px-4 text-sm outline-none transition-shadow focus:shadow-gold", errors[`contact.${k}`] ? "border-danger" : "border-line-strong");

  return (
    <div>
      <ol className="mb-10 flex items-center gap-3 text-sm" aria-label="Teklif adımları">
        {[
          [1, isCart ? "Sepeti kontrol edin" : "Kiti kontrol edin"],
          [2, "İletişim ve teslimat"],
        ].map(([n, l]) => (
          <li key={n} className="flex items-center gap-3">
            <span className={cn("grid size-8 place-items-center rounded-full text-xs font-semibold", step >= (n as number) ? "bg-ink text-ivory" : "border border-line-strong text-muted")} aria-current={step === n ? "step" : undefined}>
              {step > (n as number) ? <Icon name="check" className="size-4" /> : n}
            </span>
            <span className={step === n ? "font-semibold" : "text-muted"}>{l}</span>
            {n === 1 && <span className="h-px w-8 bg-line-strong" />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="s1" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45, ease: EASE }}>
            <p className="mb-6 text-sm text-muted">
              {isCart ? "Ürünleri, seçenekleri ve adetleri kontrol edin." : "Ürünleri, renkleri, kit başına adetleri, kit sayısını ve kişiselleştirme tercihlerini kontrol edin."}
            </p>
            {isCart ? <CartList /> : <KitWorkspace showActions={false} />}
            {missingVariant && <p className="mt-4 text-sm text-warning">Renk seçilmemiş ürünler için uygun renk teklif aşamasında önerilecek.</p>}
            <div className="mt-8 flex justify-end">
              <Button size="lg" onClick={() => setStep(2)}>
                Devam <Icon name="arrow" className="size-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.form key="s2" noValidate onSubmit={submit} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.45, ease: EASE }} className="space-y-6">
            <div className="rounded-card border border-line bg-paper p-5 text-sm">
              <span className="font-display text-xl">{draft.name}</span>
              <span className="ml-3 text-muted">
                {isCart ? `${draft.lines.length} ürün · ${draft.lines.reduce((a, l) => a + l.qty, 0).toLocaleString("tr-TR")} adet` : `${draft.lines.length} ürün · ${draft.kitQuantity.toLocaleString("tr-TR")} kit`}
              </span>
              <button type="button" onClick={() => setStep(1)} className="ml-3 text-xs font-semibold underline decoration-champagne underline-offset-4">
                Düzenle
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {(
                [
                  ["company", "Firma adı", "text", "organization"],
                  ["fullName", "Ad soyad", "text", "name"],
                  ["email", "E-posta", "email", "email"],
                  ["phone", "Telefon", "tel", "tel"],
                  ["city", "Teslimat şehri", "text", "address-level2"],
                  ["deliveryDate", "İstenen teslim tarihi (isteğe bağlı)", "date", "off"],
                ] as const
              ).map(([k, label, type, ac]) => (
                <div key={k}>
                  <label htmlFor={`f-${k}`} className="mb-1.5 block text-sm font-medium">
                    {label}
                  </label>
                  <input {...field(k)} type={type} autoComplete={ac} min={type === "date" ? new Date().toISOString().slice(0, 10) : undefined} className={inputCls(k)} />
                  {err(k)}
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="f-notes" className="mb-1.5 block text-sm font-medium">
                Ek açıklamalar
              </label>
              <textarea {...field("notes")} rows={4} maxLength={2000} placeholder="Baskı renkleri, ambalaj tercihleri, teslimat adresi detayları…" className={cn(inputCls("notes"), "h-auto py-3")} />
              {err("notes")}
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium">Logo veya referans dosyası (isteğe bağlı)</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold hover:border-ink">
                <Icon name="upload" className="size-4" /> {file ? "Değiştir" : "Dosya seç"}
                <input
                  type="file"
                  accept={LOGO_ACCEPT}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const v = validateLogo(f);
                    setErrors((x) => {
                      const n = { ...x };
                      if (v) n.attachment = v;
                      else delete n.attachment;
                      return n;
                    });
                    if (!v) setFile(f);
                  }}
                />
              </label>
              {file && (
                <span className="ml-3 text-sm">
                  {file.name}{" "}
                  <button type="button" className="text-xs text-danger underline" onClick={() => setFile(null)}>
                    kaldır
                  </button>
                </span>
              )}
              <p className="mt-1.5 text-xs text-muted">PNG, JPG, SVG veya PDF · en fazla 5 MB</p>
              {errors.attachment && <p className="mt-1 text-xs text-danger">{errors.attachment}</p>}
            </div>

            <div className="space-y-3 rounded-card border border-line bg-paper p-5 text-sm">
              <label className="flex items-start gap-3">
                <input type="checkbox" id="f-kvkkConsent" checked={form.kvkkConsent} onChange={(e) => setForm((f) => ({ ...f, kvkkConsent: e.target.checked }))} className="mt-0.5 size-4 accent-[var(--color-ink)]" aria-invalid={!!errors["contact.kvkkConsent"] || undefined} />
                <span>
                  <Link href="/kvkk" target="_blank" className="font-semibold underline decoration-champagne underline-offset-4">
                    KVKK Aydınlatma Metni
                  </Link>
                  &apos;ni okudum; {isCart ? "siparişimin işlenmesi ve ödemenin alınması" : "teklif talebimin değerlendirilmesi"} amacıyla kişisel verilerimin işlenmesini anladım. <span className="text-danger">*</span>
                </span>
              </label>
              {errors["contact.kvkkConsent"] && <p className="text-xs text-danger">{errors["contact.kvkkConsent"]}</p>}
              <label className="flex items-start gap-3 text-muted">
                <input type="checkbox" checked={form.marketingConsent} onChange={(e) => setForm((f) => ({ ...f, marketingConsent: e.target.checked }))} className="mt-0.5 size-4 accent-[var(--color-ink)]" />
                <span>Kampanya ve yeni ürün duyurularını e-posta ile almak istiyorum (isteğe bağlı açık rıza).</span>
              </label>
            </div>

            {isCart && paymentsEnabled && (
              <label className="flex items-start gap-3 rounded-soft border border-line bg-paper p-4 text-sm">
                <input type="checkbox" id="f-salesConsent" checked={salesConsent} onChange={(e) => setSalesConsent(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-ink)]" />
                <span>
                  Kartla ödeme için:{" "}
                  <Link href="/mesafeli-satis" target="_blank" className="font-semibold underline decoration-champagne underline-offset-4">
                    Ön bilgilendirme formu ve mesafeli satış sözleşmesi
                  </Link>
                  &apos;ni okudum ve onaylıyorum.
                </span>
              </label>
            )}

            {formError && (
              <p role="alert" className="rounded-soft bg-danger/10 px-4 py-3 text-sm text-danger">
                {formError}
              </p>
            )}

            <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                <Icon name="arrowLeft" className="size-4" /> {isCart ? "Sepete dön" : "Kite dön"}
              </Button>
              <div className="flex flex-col gap-3 sm:flex-row">
                {isCart && paymentsEnabled && (
                  <button type="button" onClick={pay} disabled={sending} className="btn-glow">
                    <Icon name="check" className="size-5" /> {sending ? "Yönlendiriliyor…" : "Kartla öde"}
                  </button>
                )}
                <Button type="submit" size="lg" variant={isCart && paymentsEnabled ? "outline" : "gold"} disabled={sending}>
                  {sending ? "Gönderiliyor…" : isCart ? "Sipariş talebi gönder" : "Teklif talebini gönder"}
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
