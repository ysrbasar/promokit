"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  addLine,
  emptyDraft,
  parseSavedKits,
  removeLine,
  replaceLine,
  setKitQuantity,
  setLinePersonalization,
  setLineQty,
  setLineVariant,
  type KitDraft,
  type KitLine,
} from "./kitState";

/**
 * Global kit mağazası. Kalıcı sunucu hesabı olmadığından kitler YALNIZCA bu tarayıcıda
 * (localStorage) saklanır — arayüzde kullanıcıya açıkça belirtilir.
 */
type KitStore = {
  draft: KitDraft;
  saved: KitDraft[];
  favorites: string[];
  lastAdded: string | null;
  add: (line: Omit<KitLine, "qty" | "personalization"> & Partial<KitLine>) => boolean;
  remove: (code: string) => void;
  setQty: (code: string, qty: number) => void;
  setVariant: (code: string, variant: string | null) => void;
  setPersonalization: (code: string, p: string[]) => void;
  replace: (oldCode: string, next: { productCode: string; variantCode: string | null }) => void;
  setKitQuantity: (n: number) => void;
  rename: (name: string) => void;
  loadDraft: (d: Partial<KitDraft> & Pick<KitDraft, "lines">) => void;
  reset: () => void;
  saveCurrent: () => void;
  openSaved: (id: string) => void;
  deleteSaved: (id: string) => void;
  toggleFavorite: (code: string) => void;
};

export const useKit = create<KitStore>()(
  persist(
    (set, get) => ({
      draft: emptyDraft(),
      saved: [],
      favorites: [],
      lastAdded: null,
      add: (line) => {
        const before = get().draft;
        const after = addLine(before, line);
        if (after === before) return false;
        set({ draft: after, lastAdded: line.productCode });
        return true;
      },
      remove: (code) => set((s) => ({ draft: removeLine(s.draft, code) })),
      setQty: (code, qty) => set((s) => ({ draft: setLineQty(s.draft, code, qty) })),
      setVariant: (code, v) => set((s) => ({ draft: setLineVariant(s.draft, code, v) })),
      setPersonalization: (code, p) => set((s) => ({ draft: setLinePersonalization(s.draft, code, p) })),
      replace: (oldCode, next) => set((s) => ({ draft: replaceLine(s.draft, oldCode, next) })),
      setKitQuantity: (n) => set((s) => ({ draft: setKitQuantity(s.draft, n) })),
      rename: (name) => set((s) => ({ draft: { ...s.draft, name: name.slice(0, 80) || "Kitim" } })),
      loadDraft: (d) => set({ draft: { ...emptyDraft(), ...d, updatedAt: new Date().toISOString() } }),
      reset: () => set({ draft: emptyDraft() }),
      saveCurrent: () =>
        set((s) => {
          const d = { ...s.draft, updatedAt: new Date().toISOString() };
          return { saved: [d, ...s.saved.filter((k) => k.id !== d.id)].slice(0, 20) };
        }),
      openSaved: (id) =>
        set((s) => {
          const k = s.saved.find((x) => x.id === id);
          return k ? { draft: { ...k } } : {};
        }),
      deleteSaved: (id) => set((s) => ({ saved: s.saved.filter((k) => k.id !== id) })),
      toggleFavorite: (code) =>
        set((s) => ({
          favorites: s.favorites.includes(code) ? s.favorites.filter((c) => c !== code) : [code, ...s.favorites].slice(0, 200),
        })),
    }),
    {
      name: "promokit-kit-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ draft: s.draft, saved: s.saved, favorites: s.favorites }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<KitStore>;
        const [draft] = parseSavedKits(p.draft ? [p.draft] : []);
        return {
          ...current,
          draft: draft ?? current.draft,
          saved: parseSavedKits(p.saved ?? []),
          favorites: Array.isArray(p.favorites) ? p.favorites.filter((x): x is string => typeof x === "string") : [],
        };
      },
    },
  ),
);

/** SSR ile hidrasyon uyuşmazlığını önlemek için mağaza yüklendi mi */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
