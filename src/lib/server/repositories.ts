import "server-only";
import path from "node:path";
import { z } from "zod";
import { CatalogFile, type Product } from "../catalog/schema";
import { productStatus } from "../catalog/stock";
import { DEFAULT_SETTINGS, SettingsSchema, type Settings } from "../config/settings";
import { ReadyKitsFile, type ReadyKit } from "../kit/readyKits";
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

async function loadBase(): Promise<{ file: CatalogFile; path: string }> {
  const imported = await readJson<unknown>(IMPORTED_FILE);
  if (imported) {
    const parsed = CatalogFile.safeParse(imported);
    if (parsed.success && parsed.data.products.length > 0) return { file: parsed.data, path: IMPORTED_FILE };
    if (!parsed.success) console.error("[katalog] data/catalog.json geçersiz, örnek kataloğa dönülüyor:", parsed.error.issues.slice(0, 3));
  }
  const demo = CatalogFile.parse(await readJson<unknown>(DEMO_FILE));
  return { file: demo, path: DEMO_FILE };
}

export async function getCatalog(): Promise<{ products: Product[]; info: CatalogInfo }> {
  const [a, b, c, d] = await Promise.all([mtime(IMPORTED_FILE), mtime(DEMO_FILE), mtime(OVERRIDES_FILE), mtime(SETTINGS_FILE)]);
  const key = `${a}:${b}:${c}:${d}`;
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

export async function setOverride(productCode: string, patch: ProductOverride) {
  const all = await getOverrides();
  all[productCode] = { ...all[productCode], ...ProductOverride.parse(patch) };
  await writeJson(OVERRIDES_FILE, all);
}

/* ───────────────────────── Hazır kitler ───────────────────────── */

const KITS_DEFAULT = path.join(DATA_DIR, "kits.json");
const KITS_RUNTIME = path.join(RUNTIME_DIR, "kits.json");

/** Yönetici düzenlemesi varsa onu, yoksa depodaki başlangıç kitlerini kullanır */
export async function getReadyKits(): Promise<ReadyKit[]> {
  const raw = (await readJson<unknown>(KITS_RUNTIME)) ?? (await readJson<unknown>(KITS_DEFAULT));
  return ReadyKitsFile.parse(raw ?? { kits: [] }).kits;
}

export async function saveReadyKits(kits: ReadyKit[]) {
  await writeJson(KITS_RUNTIME, ReadyKitsFile.parse({ kits }));
}

/* ───────────────────────── Veri kalitesi raporu ───────────────────────── */

export async function getImportReport() {
  return readJson<Record<string, unknown>>(path.join(DATA_DIR, "import", "report.json"));
}
