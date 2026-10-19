"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { LiteProduct } from "@/lib/catalog/lite";
import type { BudgetTier } from "@/lib/config/settings";

type Ctx = {
  kind: "import" | "demo";
  minStock: number;
  budgetTiers: BudgetTier[];
  printMarkupPct: number;
};

const CatalogCtx = createContext<Ctx>({ kind: "demo", minStock: 50, budgetTiers: [], printMarkupPct: 0 });

export function CatalogProvider({ value, children }: { value: Ctx; children: React.ReactNode }) {
  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

export const useCatalogInfo = () => useContext(CatalogCtx);

/** Ürün kodu → hafif ürün önbelleği (sayfa ömrü boyunca) */
const cache = new Map<string, LiteProduct | null>();
const listeners = new Set<() => void>();

export function primeProducts(list: LiteProduct[]) {
  let changed = false;
  for (const p of list) {
    if (cache.get(p.productCode) !== p) {
      cache.set(p.productCode, p);
      changed = true;
    }
  }
  if (changed) listeners.forEach((l) => l());
}

/** Verilen kodların ürün bilgisini getirir; önbellekte olmayanları API'den toplu çeker */
export function useProducts(codes: string[]) {
  const [, force] = useState(0);
  const key = codes.join("|");
  const pending = useRef<string>("");

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    const missing = codes.filter((c) => !cache.has(c));
    if (!missing.length || pending.current === missing.join("|")) return;
    pending.current = missing.join("|");
    fetch(`/api/products?codes=${encodeURIComponent(missing.join(","))}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d: { products: LiteProduct[] }) => {
        for (const c of missing) if (!cache.has(c)) cache.set(c, null);
        primeProducts(d.products);
        listeners.forEach((l) => l());
      })
      .catch(() => {
        pending.current = "";
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const get = useCallback((code: string) => cache.get(code), []);
  const loading = codes.some((c) => !cache.has(c));
  return useMemo(() => ({ get, loading }), [get, loading]);
}
