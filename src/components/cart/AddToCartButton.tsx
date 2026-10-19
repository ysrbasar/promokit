"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { LiteProduct } from "@/lib/catalog/lite";
import { useCart } from "@/lib/cart/store";
import { Button, Icon, cn } from "../ui/primitives";

/** Tekli satın alma: ürünü sepete ekler (adet = minimum sipariş adedi veya 1) */
export function AddToCartButton({
  product: p,
  variantCode = null,
  qty,
  size = "md",
  className,
}: {
  product: Pick<LiteProduct, "productCode" | "name" | "minOrderQty" | "variants">;
  variantCode?: string | null;
  qty?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);
  return (
    <>
      <Button
        size={size === "sm" ? "sm" : size}
        variant="outline"
        className={cn("relative", className)}
        onClick={() => {
          add({ productCode: p.productCode, variantCode: variantCode ?? p.variants[0]?.code ?? null, qty: qty ?? p.minOrderQty ?? 1 });
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        }}
      >
        <Icon name={done ? "check" : "cart"} className="size-4" /> {done ? "Sepette" : "Sepete ekle"}
      </Button>
      <AnimatePresence>
        {done && (
          <motion.div role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-14 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-6 py-3 text-sm text-ivory shadow-lift">
            <Icon name="cart" className="size-4 text-champagne" /> {p.name} sepete eklendi ·{" "}
            <a href="/sepet" className="font-semibold underline underline-offset-4">
              Sepete git
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
