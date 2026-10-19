"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LiteProduct } from "@/lib/catalog/lite";
import {
  AUDIENCES,
  PERSONALIZATION,
  PURPOSES,
  QUANTITY_RANGES,
  STYLES,
  TIMINGS,
  WIZARD_CATEGORIES,
  labelOf,
  type Option,
} from "@/lib/config/taxonomy";
import { EMPTY_ANSWERS, SURPRISE, type KitRecommendation, type WizardAnswers } from "@/lib/kit/recommendation";
import { LOGO_ACCEPT, getLogo, setLogo, validateLogo } from "@/lib/kit/logoStore";
import { useKit } from "@/lib/kit/store";
import { primeProducts, useCatalogInfo } from "../providers/CatalogContext";
import { EASE } from "../ui/motion";
import { Badge, Button, ButtonLink, Icon, Skeleton, cn } from "../ui/primitives";
import { KitWorkspace } from "./KitWorkspace";

type StepKey = "purpose" | "audience" | "quantity" | "budget" | "style" | "categories" | "personalization" | "timing" | "result";

const STEPS: { key: StepKey; title: string; question: string; hint?: string }[] = [
  { key: "purpose", title: "Amaç", question: "Bu kiti hangi amaçla hazırlıyorsunuz?" },
  { key: "audience", title: "Hedef kitle", question: "Bu kit kimler için hazırlanıyor?" },
  { key: "quantity", title: "Adet", question: "Kaç adet kit hazırlamak istiyorsunuz?", hint: "Öneriler yalnızca bu adet için yeterli stoğu olan ürünlerden oluşturulur." },
  { key: "budget", title: "Bütçe", question: "Bir kit için yaklaşık bütçeniz nedir?", hint: "Aralıklar yol göstericidir; kesin tutar adet ve baskıya göre teklifle netleşir." },
  { key: "style", title: "Stil", question: "Markanızı nasıl yansıtmak istiyorsunuz?" },
  { key: "categories", title: "Ürünler", question: "Kitinizde hangi ürün grupları bulunsun?", hint: "Birden fazla seçebilirsiniz. İstemediğiniz grupları hariç tutun." },
  { key: "personalization", title: "Marka", question: "Ürünlerinizi markanıza özel hazırlamak ister misiniz?" },
  { key: "timing", title: "Zamanlama", question: "Kitler ne zaman hazır olmalı?", hint: "Teslim tarihi tedarikçi onayıyla teklifte kesinleşir." },
  { key: "result", title: "Kitiniz", question: "Size özel kit önerisi" },
];

const GLYPH: Record<string, string> = {
  welcome: "◐", client: "◇", dealer: "⬡", event: "✦", vip: "♛", education: "◎", seasonal: "❄", other: "…",
  employees: "Ç", clients: "M", partners: "İ", executives: "Y", students: "Ö", attendees: "K", general: "G",
  minimal: "—", luxury: "◆", tech: "⌁", eco: "❦", dynamic: "↗", classic: "▣", creative: "✺",
};

function readPresets(): Partial<WizardAnswers> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const out: Partial<WizardAnswers> = {};
  if (sp.get("amac") && PURPOSES.some((p) => p.key === sp.get("amac"))) out.purpose = sp.get("amac");
  if (sp.get("butce")) out.budgetKey = sp.get("butce");
  return out;
}

export function KitBuilderWizard() {
  const router = useRouter();
  const { budgetTiers } = useCatalogInfo();
  const loadDraft = useKit((s) => s.loadDraft);
  const [answers, setAnswers] = useState<WizardAnswers>(EMPTY_ANSWERS);
  const [quantityKey, setQuantityKey] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [result, setResult] = useState<KitRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const preset = readPresets();
    if (Object.keys(preset).length) setAnswers((a) => ({ ...a, ...preset }));
  }, []);

  const current = STEPS[step];
  const set = <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => setAnswers((a) => ({ ...a, [k]: v }));

  const canContinue = useMemo(() => {
    switch (current.key) {
      case "purpose":
        return !!answers.purpose;
      case "audience":
        return !!answers.audience;
      case "quantity":
        return answers.quantity >= 1 && !!quantityKey;
      case "budget":
        return !!answers.budgetKey;
      case "style":
        return !!answers.style;
      case "timing":
        return !!answers.timing;
      default:
        return true;
    }
  }, [current.key, answers, quantityKey]);

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
    setSummaryOpen(false);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    go(STEPS.length - 1);
    try {
      const r = await fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(answers) });
      if (!r.ok) throw new Error();
      const d = (await r.json()) as { kit: KitRecommendation; products: LiteProduct[] };
      primeProducts(d.products);
      setResult(d.kit);
      loadDraft({
        name: d.kit.name,
        kitQuantity: Math.max(1, answers.quantity),
        source: "wizard",
        answers: { ...answers },
        lines: d.kit.items.map((i) => ({
          productCode: i.productCode,
          variantCode: i.variantCode,
          qty: i.qty,
          personalization: answers.personalization.filter((p) => p !== "later"),
        })),
      });
    } catch {
      setError("Öneri oluşturulamadı. Bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const next = () => (step === STEPS.length - 2 ? generate() : go(step + 1));

  return (
    <div className={cn("mx-auto grid max-w-[1320px] gap-10 px-4 pb-28 pt-28 sm:px-6 lg:px-10 lg:pt-32", current.key !== "result" && "lg:grid-cols-[1fr_380px]")}>
      <div className="min-w-0">
        {/* İlerleme */}
        <nav aria-label="Sihirbaz adımları" className="mb-10">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              Adım {step + 1} / {STEPS.length}
            </span>
            <span className="font-semibold text-ink">{current.title}</span>
          </div>
          <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
            <motion.div className="h-full bg-gradient-to-r from-champagne to-gold-deep" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.7, ease: EASE }} />
          </div>
          <ol className="mt-4 hidden gap-1 sm:flex">
            {STEPS.map((s, i) => (
              <li key={s.key} className="flex-1">
                <button
                  type="button"
                  disabled={i > step || current.key === "result"}
                  onClick={() => go(i)}
                  className={cn("w-full truncate text-left text-[0.68rem] uppercase tracking-[0.14em] transition-colors", i === step ? "text-ink" : i < step ? "text-gold-deep hover:text-ink" : "text-subtle")}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={current.key}
            custom={dir}
            initial={{ opacity: 0, x: dir * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -48 }}
            transition={{ duration: 0.55, ease: EASE }}
            aria-labelledby="wizard-q"
          >
            <h1 id="wizard-q" ref={headingRef} tabIndex={-1} className="text-4xl leading-[1.05] outline-none sm:text-5xl lg:text-6xl">
              {current.question}
            </h1>
            {current.hint && <p className="mt-4 max-w-xl text-sm text-muted">{current.hint}</p>}

            <div className="mt-10">
              {current.key === "purpose" && <ChoiceGrid options={PURPOSES} value={answers.purpose} onChange={(v) => set("purpose", v)} />}
              {current.key === "audience" && <ChoiceGrid options={AUDIENCES} value={answers.audience} onChange={(v) => set("audience", v)} />}
              {current.key === "quantity" && (
                <QuantityStep
                  rangeKey={quantityKey}
                  quantity={answers.quantity}
                  onRange={(k, v) => {
                    setQuantityKey(k);
                    set("quantity", v);
                  }}
                  onCustom={(n) => {
                    setQuantityKey("custom");
                    set("quantity", n);
                  }}
                />
              )}
              {current.key === "budget" && (
                <ChoiceGrid options={budgetTiers.map((b) => ({ key: b.key, label: b.label }))} value={answers.budgetKey} onChange={(v) => set("budgetKey", v)} cols="sm:grid-cols-3 lg:grid-cols-4" />
              )}
              {current.key === "style" && <ChoiceGrid options={STYLES} value={answers.style} onChange={(v) => set("style", v)} />}
              {current.key === "categories" && (
                <CategoriesStep
                  include={answers.categories}
                  exclude={answers.excludeCategories}
                  onChange={(include, exclude) => setAnswers((a) => ({ ...a, categories: include, excludeCategories: exclude }))}
                />
              )}
              {current.key === "personalization" && <PersonalizationStep value={answers.personalization} onChange={(v) => set("personalization", v)} />}
              {current.key === "timing" && (
                <div className="space-y-8">
                  <ChoiceGrid options={TIMINGS} value={answers.timing} onChange={(v) => set("timing", v)} cols="sm:grid-cols-2 lg:grid-cols-4" />
                  <label className="flex max-w-sm flex-col gap-2 text-sm">
                    <span className="text-muted">Belirli bir tarih (isteğe bağlı)</span>
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={answers.deliveryDate ?? ""}
                      onChange={(e) => set("deliveryDate", e.target.value || null)}
                      className="h-12 rounded-full border border-line-strong bg-paper px-5"
                    />
                  </label>
                </div>
              )}
              {current.key === "result" && (
                <ResultStep loading={loading} error={error} result={result} answers={answers} onRetry={generate} onRestart={() => go(0)} />
              )}
            </div>
          </motion.section>
        </AnimatePresence>

        {current.key !== "result" && (
          <div className="sticky bottom-0 z-20 -mx-4 mt-12 flex items-center justify-between gap-3 border-t border-line bg-ivory/90 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
            <Button variant="ghost" onClick={() => (step === 0 ? router.push("/") : go(step - 1))}>
              <Icon name="arrowLeft" className="size-4" /> Geri
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" className="lg:hidden" onClick={() => setSummaryOpen(true)}>
                Özet
              </Button>
              <Button onClick={next} disabled={!canContinue}>
                {step === STEPS.length - 2 ? "Kitimi oluştur" : "Devam"} <Icon name="arrow" className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Canlı özet: masaüstünde sabit, mobilde alt panel */}
      {current.key !== "result" && (
        <aside className="hidden lg:block" aria-label="Canlı kit özeti">
          <div className="sticky top-28 space-y-6">
            <AnswersSummary answers={answers} onEdit={(i) => go(i)} />
          </div>
        </aside>
      )}
      <AnimatePresence>
        {summaryOpen && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSummaryOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Seçimleriniz"
              className="fixed inset-x-0 bottom-0 z-[61] max-h-[80vh] overflow-y-auto rounded-t-[1.5rem] bg-ivory p-6 lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
              <AnswersSummary answers={answers} onEdit={(i) => go(i)} />
              <Button variant="outline" className="mt-6 w-full" onClick={() => setSummaryOpen(false)}>
                Kapat
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  function AnswersSummary({ answers: a, onEdit }: { answers: WizardAnswers; onEdit: (i: number) => void }) {
    const rows: [string, string | null, number][] = [
      ["Amaç", a.purpose ? labelOf(PURPOSES, a.purpose) : null, 0],
      ["Hedef kitle", a.audience ? labelOf(AUDIENCES, a.audience) : null, 1],
      ["Adet", quantityKey ? `${a.quantity.toLocaleString("tr-TR")} kit` : null, 2],
      ["Bütçe", a.budgetKey ? budgetTiers.find((b) => b.key === a.budgetKey)?.label ?? null : null, 3],
      ["Stil", a.style ? labelOf(STYLES, a.style) : null, 4],
      ["Ürünler", a.categories.length ? a.categories.map((c) => (c === SURPRISE ? "Sürpriz" : labelOf(WIZARD_CATEGORIES, c))).join(", ") : null, 5],
      ["Kişiselleştirme", a.personalization.length ? a.personalization.map((p) => labelOf(PERSONALIZATION, p)).join(", ") : null, 6],
      ["Zamanlama", a.timing ? labelOf(TIMINGS, a.timing) + (a.deliveryDate ? ` · ${new Date(a.deliveryDate).toLocaleDateString("tr-TR")}` : "") : null, 7],
    ];
    return (
      <div className="rounded-card border border-line bg-paper p-6 shadow-card">
        <p className="eyebrow">Seçimleriniz</p>
        <dl className="mt-4 divide-y divide-line">
          {rows.map(([k, v, i]) => (
            <div key={k} className="flex items-start justify-between gap-4 py-3 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right">
                {v ? (
                  <button type="button" onClick={() => onEdit(i)} className="text-right font-medium decoration-champagne underline-offset-4 hover:underline">
                    {v}
                  </button>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
}

function ChoiceGrid({ options, value, onChange, cols = "sm:grid-cols-2 lg:grid-cols-3" }: { options: Option[]; value: string | null; onChange: (v: string) => void; cols?: string }) {
  return (
    <div role="radiogroup" className={cn("grid grid-cols-1 gap-3", cols)}>
      {options.map((o, i) => {
        const on = value === o.key;
        return (
          <motion.button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.key)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i, duration: 0.5, ease: EASE }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "group relative flex min-h-24 items-center gap-4 overflow-hidden rounded-card border p-5 text-left transition-[border-color,background-color,box-shadow] duration-300",
              on ? "border-champagne bg-ink text-ivory shadow-gold" : "border-line bg-paper hover:border-line-strong hover:shadow-card",
            )}
          >
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-full border font-display text-xl", on ? "border-champagne/60 text-champagne" : "border-line text-gold-deep")} aria-hidden>
              {GLYPH[o.key] ?? o.label[0]}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl leading-tight">{o.label}</span>
              {o.hint && <span className={cn("mt-1 block text-xs", on ? "text-ivory/60" : "text-muted")}>{o.hint}</span>}
            </span>
            <span className={cn("absolute right-4 top-4 grid size-5 place-items-center rounded-full border transition-all", on ? "border-champagne bg-champagne text-ink" : "border-line-strong")} aria-hidden>
              {on && <Icon name="check" className="size-3" />}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function QuantityStep({ rangeKey, quantity, onRange, onCustom }: { rangeKey: string | null; quantity: number; onRange: (k: string, v: number) => void; onCustom: (n: number) => void }) {
  return (
    <div className="space-y-8">
      <ChoiceGrid
        options={QUANTITY_RANGES.map((q) => ({ key: q.key, label: `${q.label} kit` }))}
        value={rangeKey === "custom" ? null : rangeKey}
        onChange={(k) => onRange(k, QUANTITY_RANGES.find((q) => q.key === k)!.value)}
      />
      <label className="flex max-w-sm flex-col gap-2 text-sm">
        <span className="text-muted">Ya da tam adedi yazın</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={100000}
          placeholder="Örn. 180"
          value={rangeKey === "custom" ? quantity : ""}
          onChange={(e) => onCustom(Math.max(0, Math.min(100000, Number(e.target.value) || 0)))}
          className="h-12 rounded-full border border-line-strong bg-paper px-5"
        />
      </label>
    </div>
  );
}

function CategoriesStep({ include, exclude, onChange }: { include: string[]; exclude: string[]; onChange: (inc: string[], exc: string[]) => void }) {
  const toggle = (k: string) => {
    if (include.includes(k)) onChange(include.filter((x) => x !== k), [...exclude, k].filter((x) => x !== SURPRISE));
    else if (exclude.includes(k)) onChange(include, exclude.filter((x) => x !== k));
    else onChange([...include, k], exclude);
  };
  const opts = [...WIZARD_CATEGORIES, { key: SURPRISE, label: "Sürpriz ürün önerileri", hint: "Kiti sizin için tamamlayalım" }];
  return (
    <div>
      <p className="mb-4 text-xs text-muted">
        Bir kez dokunun: <Badge tone="dark">dahil</Badge> · iki kez: <Badge tone="danger">hariç</Badge> · üç kez: seçimi kaldır
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {opts.map((o, i) => {
          const state = include.includes(o.key) ? "in" : exclude.includes(o.key) ? "out" : "none";
          return (
            <motion.button
              key={o.key}
              type="button"
              aria-pressed={state !== "none"}
              aria-label={`${o.label}: ${state === "in" ? "dahil" : state === "out" ? "hariç" : "seçili değil"}`}
              onClick={() => (o.key === SURPRISE ? onChange(include.includes(SURPRISE) ? include.filter((x) => x !== SURPRISE) : [...include, SURPRISE], exclude) : toggle(o.key))}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.025 * i }}
              className={cn(
                "flex min-h-20 items-center justify-between gap-3 rounded-card border p-5 text-left transition-all duration-300",
                state === "in" && "border-champagne bg-ink text-ivory shadow-gold",
                state === "out" && "border-danger/30 bg-danger/5 text-muted line-through decoration-danger/50",
                state === "none" && "border-line bg-paper hover:border-line-strong",
              )}
            >
              <span>
                <span className="block font-display text-xl leading-tight">{o.label}</span>
                {o.hint && <span className={cn("mt-1 block text-xs no-underline", state === "in" ? "text-ivory/60" : "text-muted")}>{o.hint}</span>}
              </span>
              <Icon name={state === "in" ? "check" : state === "out" ? "close" : "plus"} className={cn("size-4 shrink-0", state === "in" && "text-champagne")} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function PersonalizationStep({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [file, setFile] = useState<File | null>(() => getLogo());
  const [err, setErr] = useState<string | null>(null);
  const toggle = (k: string) => {
    if (k === "later") return onChange(value.includes("later") ? [] : ["later"]);
    const base = value.filter((x) => x !== "later");
    onChange(base.includes(k) ? base.filter((x) => x !== k) : [...base, k]);
  };
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONALIZATION.map((o) => {
          const on = value.includes(o.key);
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.key)}
              className={cn("flex min-h-20 items-center justify-between gap-3 rounded-card border p-5 text-left transition-all duration-300", on ? "border-champagne bg-ink text-ivory shadow-gold" : "border-line bg-paper hover:border-line-strong")}
            >
              <span className="font-display text-xl leading-tight">{o.label}</span>
              <Icon name={on ? "check" : "plus"} className={cn("size-4 shrink-0", on && "text-champagne")} />
            </button>
          );
        })}
      </div>
      <div className="rounded-card border border-dashed border-line-strong bg-paper p-6">
        <p className="font-display text-xl">Logonuzu ekleyin (isteğe bağlı)</p>
        <p className="mt-1 text-xs text-muted">PNG, JPG, SVG veya PDF · en fazla 5 MB. Baskı önizlemesi teklif sürecinde tasarım ekibince hazırlanır; bu aşamada otomatik önizleme yapılmaz.</p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold hover:border-ink">
          <Icon name="upload" className="size-4" /> {file ? "Değiştir" : "Dosya seç"}
          <input
            type="file"
            accept={LOGO_ACCEPT}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (!f) return;
              const v = validateLogo(f);
              setErr(v);
              if (!v) {
                setLogo(f);
                setFile(f);
              }
            }}
          />
        </label>
        {file && (
          <p className="mt-3 flex items-center gap-2 text-sm">
            <Icon name="check" className="size-4 text-success" /> {file.name}
            <button type="button" className="text-xs text-danger underline" onClick={() => (setLogo(null), setFile(null))}>
              kaldır
            </button>
          </p>
        )}
        {err && <p role="alert" className="mt-3 text-sm text-danger">{err}</p>}
      </div>
    </div>
  );
}

function ResultStep({
  loading,
  error,
  result,
  answers,
  onRetry,
  onRestart,
}: {
  loading: boolean;
  error: string | null;
  result: KitRecommendation | null;
  answers: WizardAnswers;
  onRetry: () => void;
  onRestart: () => void;
}) {
  if (loading)
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <p className="text-sm text-muted">Stoktaki ürünler cevaplarınıza göre puanlanıyor…</p>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  if (error)
    return (
      <div role="alert" className="rounded-card border border-danger/30 bg-danger/5 p-6">
        <p>{error}</p>
        <Button className="mt-4" onClick={onRetry}>
          Tekrar dene
        </Button>
      </div>
    );
  if (!result) return null;

  if (result.items.length === 0)
    return (
      <div className="rounded-card border border-line bg-paper p-8">
        <p className="font-display text-3xl">Uygun kombinasyon bulunamadı</p>
        <p className="mt-3 max-w-xl text-muted">{result.emptyReason}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={onRestart}>Cevapları düzenle</Button>
          <ButtonLink href="/katalog" variant="outline">
            Katalogdan seç
          </ButtonLink>
          <ButtonLink href="/hazir-kitler" variant="ghost">
            Hazır kitlere göz at
          </ButtonLink>
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dark-surface relative overflow-hidden rounded-card bg-ink p-8 text-ivory">
        <div className="hairline absolute inset-x-0 top-0" />
        <p className="eyebrow">Önerilen kit</p>
        <p className="mt-3 font-display text-4xl sm:text-5xl">{result.name}</p>
        <p className="mt-3 max-w-xl text-ivory/70">{result.concept}</p>
        <p className="mt-4 text-sm text-ivory/50">
          {result.items.length} ürün · {answers.quantity.toLocaleString("tr-TR")} kit için stok koşulunu karşılıyor
        </p>
      </motion.div>
      {result.notes.length > 0 && (
        <ul className="space-y-2">
          {result.notes.map((n) => (
            <li key={n} className="flex gap-2 text-sm text-muted">
              <Icon name="info" className="size-4 shrink-0 text-gold-deep" /> {n}
            </li>
          ))}
        </ul>
      )}
      <KitWorkspace layout="grid" />
      <p className="text-sm text-muted">
        Ürünleri çıkarabilir, renk, adet ve logo baskısını değiştirebilir, <strong>Değiştir</strong> ile benzer alternatifleri görebilirsiniz. Daha fazla ürün için{" "}
        <Link href="/katalog" className="font-semibold underline decoration-champagne underline-offset-4">
          katalogdan ekleyin
        </Link>
        .
      </p>
      <Button variant="outline" onClick={onRestart}>
        Cevapları düzenle
      </Button>
    </div>
  );
}
