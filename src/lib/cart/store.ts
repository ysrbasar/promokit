"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Sepet: kit dışında tekli ürün siparişi. Kit gibi YALNIZCA bu tarayıcıda saklanır;
 * ödeme alınmaz, sepet sipariş talebi olarak gönderilir.
 */
export type CartItem = { productCode: string; variantCode: string | null; qty: number };

type CartStore = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQty: (code: string, qty: number) => void;
  setVariant: (code: string, variantCode: string | null) => void;
  remove: (code: string) => void;
  clear: () => void;
};

const clampQty = (n: number) => Math.max(1, Math.min(100000, Math.round(n) || 1));

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.productCode === item.productCode);
          if (existing) return { items: s.items.map((i) => (i === existing ? { ...i, qty: clampQty(i.qty + item.qty), variantCode: item.variantCode ?? i.variantCode } : i)) };
          return { items: [...s.items, { ...item, qty: clampQty(item.qty) }] };
        }),
      setQty: (code, qty) => set((s) => ({ items: s.items.map((i) => (i.productCode === code ? { ...i, qty: clampQty(qty) } : i)) })),
      setVariant: (code, variantCode) => set((s) => ({ items: s.items.map((i) => (i.productCode === code ? { ...i, variantCode } : i)) })),
      remove: (code) => set((s) => ({ items: s.items.filter((i) => i.productCode !== code) })),
      clear: () => set({ items: [] }),
    }),
    { name: "promokit-cart-v1", storage: createJSONStorage(() => localStorage) },
  ),
);
