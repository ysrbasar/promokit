import "server-only";
import path from "node:path";
import { z } from "zod";
import { CatalogFile, type Product } from "../catalog/schema";
import { productStatus } from "../catalog/stock";
import { DEFAULT_SETTINGS, SettingsSchema, type Settings } from "../config/settings";
import { ReadyKitsFile, type ReadyKit } from "../kit/readyKits";
import { SYNCED_CATALOG_FILE, SYNCED_KITS_FILE } from "../import/sync";
import { DATA_DIR, RUNTIME_DIR, mtime, readJson, writeJson } from "./jsonStore";

/* ───────────────────────── Ayarlar ───────────────────────── */

const SETTINGS_FILE = path.join(RUNTIME_DIR, "settings.json");

export async function getSettings(): Promise<Settings> {
  const raw = await readJson<unknown>(SETTINGS_FILE);
  if (!raw) return DEFAULT_SETTINGS;
  const merged = SettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...(raw as object) });
  return merged.success ? merged.data : DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = SettingsSchema.parse({ ...(await getSettings()), ...patch });
  await writeJson(SETTINGS_FILE, next);
  return next;
}

/* ───────────────────────── Ürün kataloğu ───────────────────────── */

/** Yönetici tarafından ürün bazında yapılan değişiklikler (kaynak veriden ayrı saklanır) */
export const ProductOverride = z.object({
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  category: z.string().optional(),
});
export type ProductOverride = z.infer<typeof ProductOverride>;
const OVERRIDES_FILE = path.join(RUNTIME_DIR, "product-overrides.json");
const IMPORTED_FILE = path.join(DATA_DIR, "catalog.json");
const DEMO_FILE = path.join(DATA_DIR, "demo-catalog.json");

export type CatalogInfo = { kind: "import" | "demo"; generatedAt: string; note?: string; count: number };

let cache: { key: string; products: Product[]; info: CatalogInfo } | null = null;

/** Öncelik: otomatik güncelleme çıktısı → depodaki başlangıç kataloğu → örnek katalog */
async function loadBase(): Promise<{ file: CatalogFile; path: string }> {
  for (const file of [SYNCED_CATALOG_FILE, IMPORTED_FILE]) {
    const imported = await readJson<unknown>(file);
    if (!imported) continue;
    const parsed = CatalogFile.safeParse(imported);
    if (parsed.success && parsed.data.products.length > 0) return { file: parsed.data, path: file };
    if (!parsed.success) console.error(`[katalog] ${path.basename(file)} geçersiz, sonraki kaynağa geçiliyor:`, parsed.error.issues.slice(0, 3));
  }
  const demo = CatalogFile.parse(await readJson<unknown>(DEMO_FILE));
  return { file: demo, path: DEMO_FILE };
}

export async function getCatalog(): Promise<{ products: Product[]; info: CatalogInfo }> {
  const stamps = await Promise.all([SYNCED_CATALOG_FILE, IMPORTED_FILE, DEMO_FILE, OVERRIDES_FILE, SETTINGS_FILE].map(mtime));
  const key = stamps.join(":");
  if (cache?.key === key) return cache;

  const [{ file }, overrides, settings] = await Promise.all([
    loadBase(),
    readJson<Record<string, ProductOverride>>(OVERRIDES_FILE),
    getSettings(),
  ]);
  const products = file.products.map((p) => {
    const o = overrides?.[p.productCode];
    const merged = o ? { ...p, ...o } : p;
    return { ...merged, stockStatus: productStatus(merged, settings.minStock) };
  });
  cache = {
    key,
    products,
    info: { kind: file.meta.kind, generatedAt: file.meta.generatedAt, note: file.meta.note, count: products.length },
  };
  return cache;
}

export async function getProductBySlug(slug: string) {
  const { products } = await getCatalog();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductMap() {
  const { products } = await getCatalog();
  return new Map(products.map((p) => [p.productCode, p]));
}

export async function getOverrides() {
  return (await readJson<Record<string, ProductOverride>>(OVERRIDES_FILE)) ?? {};
}

/** Birden çok ürüne tek yazımda aynı değişikliği uygular (toplu kaldır / geri al) */
export async function setOverrides(productCodes: string[], patch: ProductOverride) {
  const all = await getOverrides();
  const clean = ProductOverride.parse(patch);
  for (const code of productCodes) all[code] = { ...all[code], ...clean };
  await writeJson(OVERRIDES_FILE, all);
}

export async function setOverride(productCode: string, patch: ProductOverride) {
  const all = await getOverrides();
  all[productCode] = { ...all[productCode], ...ProductOverride.parse(patch) };
  await writeJson(OVERRIDES_FILE, all);
}

/* ───────────────────────── Hazır kitler ───────────────────────── */

const KITS_DEFAULT = path.join(DATA_DIR, "kits.json");
/** Eski biçim: yöneticinin kaydettiği tam liste (geriye dönük uyumluluk için okunur) */
const KITS_RUNTIME_LEGACY = path.join(RUNTIME_DIR, "kits.json");
/**
 * Yönetici kit durumu. Tam liste yerine farklar saklanır; böylece XML güncellemesiyle gelen YENİ setler
 * otomatik eklenir, yöneticinin KALDIRDIĞI kitler ise geri gelmez.
 *  - hidden: kaldırılan otomatik/başlangıç kitlerinin adresleri (slug)
 *  - kits:   yalnızca yöneticinin DEĞİŞTİRDİĞİ veya yeni eklediği kitler (slug ile eşleşir)
 */
const KIT_STATE_FILE = path.join(RUNTIME_DIR, "kit-state.json");
const KitState = z.object({ hidden: z.array(z.string()).default([]), kits: ReadyKitsFile.shape.kits.default([]) });
type KitState = z.infer<typeof KitState>;

async function baseKits(): Promise<ReadyKit[]> {
  const raw = (await readJson<unknown>(SYNCED_KITS_FILE)) ?? (await readJson<unknown>(KITS_DEFAULT));
  const parsed = ReadyKitsFile.safeParse(raw ?? { kits: [] });
  return parsed.success ? parsed.data.kits : [];
}

async function getKitState(): Promise<KitState | null> {
  const raw = await readJson<unknown>(KIT_STATE_FILE);
  if (raw) {
    const parsed = KitState.safeParse(raw);
    if (parsed.success) return parsed.data;
  }
  // Eski tam liste varsa farklara dönüştür
  const legacy = ReadyKitsFile.safeParse(await readJson<unknown>(KITS_RUNTIME_LEGACY));
  if (legacy.success) return diffKits(await baseKits(), legacy.data.kits);
  return null;
}

function diffKits(base: ReadyKit[], submitted: ReadyKit[]): KitState {
  const keep = new Set(submitted.map((k) => k.slug));
  const baseBySlug = new Map(base.map((k) => [k.slug, JSON.stringify(k)]));
  return {
    hidden: base.filter((k) => !keep.has(k.slug)).map((k) => k.slug),
    kits: submitted.filter((k) => baseBySlug.get(k.slug) !== JSON.stringify(k)),
  };
}

/** Sitede görünen hazır kitler: temel kitler (XML setleri veya başlangıç) − gizlenenler, yönetici düzenlemeleri uygulanmış */
export async function getReadyKits(): Promise<ReadyKit[]> {
  const [base, state] = await Promise.all([baseKits(), getKitState()]);
  if (!state) return base;
  const hidden = new Set(state.hidden);
  const edits = new Map(state.kits.map((k) => [k.slug, k]));
  const baseSlugs = new Set(base.map((k) => k.slug));
  // Temel sıra korunur, düzenlenenler yerinde değişir; yöneticinin eklediği kitler sona eklenir
  return [
    ...base.filter((k) => !hidden.has(k.slug)).map((k) => edits.get(k.slug) ?? k),
    ...state.kits.filter((k) => !baseSlugs.has(k.slug) && !hidden.has(k.slug)),
  ];
}

/** Yönetici kaydı: listeden çıkarılan temel kitler gizlenir (sonraki XML güncellemelerinde de) */
export async function saveReadyKits(kits: ReadyKit[]) {
  const [base, prev] = await Promise.all([baseKits(), getKitState()]);
  const next = diffKits(base, ReadyKitsFile.parse({ kits }).kits);
  // Daha önce gizlenmiş ve bu sefer listede olmayan kitler gizli kalır
  next.hidden = [...new Set([...(prev?.hidden ?? []).filter((s) => !kits.some((k) => k.slug === s)), ...next.hidden])];
  await writeJson(KIT_STATE_FILE, next);
}

export async function getHiddenKits(): Promise<ReadyKit[]> {
  const [base, state] = await Promise.all([baseKits(), getKitState()]);
  const hidden = new Set(state?.hidden ?? []);
  return base.filter((k) => hidden.has(k.slug));
}

export async function restoreKit(slug: string) {
  const state = (await getKitState()) ?? { hidden: [], kits: [] };
  await writeJson(KIT_STATE_FILE, { ...state, hidden: state.hidden.filter((s) => s !== slug) });
}

