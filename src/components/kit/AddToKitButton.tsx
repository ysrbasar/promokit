"use client";

import { useState } from "react";
import { bestLiteVariant, type LiteProduct } from "@/lib/catalog/lite";
import { useKit, useHydrated } from "@/lib/kit/store";
import { useCatalogInfo } from "../providers/CatalogContext";
import { Button, Icon } from "../ui/primitives";

/** Tek bir ürünü mevcut kite ekler */
export function AddToKitButton({ product: p, size = "sm" }: { product: Pick<LiteProduct, "productCode" | "variants">; size?: "sm" | "md" }) {
  const { minStock } = useCatalogInfo();
  const hydrated = useHydrated();
  const inKit = useKit((s) => s.draft.lines.some((l) => l.productCode === p.productCode));
  const add = useKit((s) => s.add);
  const [added, setAdded] = useState(false);
  const on = hydrated && (inKit || added);
  return (
    <Button
      size={size}
      disabled={on}
      onClick={() => {
        if (add({ productCode: p.productCode, variantCode: bestLiteVariant(p, minStock)?.code ?? p.variants[0]?.code ?? null })) setAdded(true);
      }}
    >
      <Icon name={on ? "check" : "plus"} className="size-4" /> {on ? "Kitinizde" : "Kitime ekle"}
    </Button>
  );
}
