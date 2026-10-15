"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LiteProduct } from "@/lib/catalog/lite";
import { useKit } from "@/lib/kit/store";
import { primeProducts } from "../providers/CatalogContext";
import { Button, Icon } from "../ui/primitives";

/** Hazır kiti kullanıcının çalışma alanına aktarır (mevcut taslağın yerine geçer; önce onay ister) */
export function ReadyKitActions({
  slug,
  name,
  lines,
  products,
}: {
  slug: string;
  name: string;
  lines: { productCode: string; variantCode: string | null; qty: number }[];
  products: LiteProduct[];
}) {
  const router = useRouter();
  const draftCount = useKit((s) => s.draft.lines.length);
  const { loadDraft, saveCurrent } = useKit();
  const [confirm, setConfirm] = useState<null | "/kitim" | "/teklif">(null);

  const apply = (to: "/kitim" | "/teklif", keepOld: boolean) => {
    if (keepOld) saveCurrent();
    primeProducts(products);
    loadDraft({
      name,
      source: "ready",
      readyKitSlug: slug,
      kitQuantity: 50,
      lines: lines.map((l) => ({ ...l, personalization: [] })),
    });
    router.push(to);
  };
  const start = (to: "/kitim" | "/teklif") => (draftCount > 0 ? setConfirm(to) : apply(to, false));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="gold" size="lg" onClick={() => start("/teklif")}>
          Teklif iste <Icon name="arrow" className="size-4" />
        </Button>
        <Button variant="light" size="lg" onClick={() => start("/kitim")}>
          Bu kiti özelleştir
        </Button>
      </div>
      {confirm && (
        <div role="alertdialog" aria-label="Mevcut kit" className="mt-5 max-w-lg rounded-card border border-ivory/15 bg-ink-2 p-5 text-sm text-ivory">
          <p>Çalışma alanınızda {draftCount} ürünlük bir kit var. Ne yapalım?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="gold" onClick={() => apply(confirm, true)}>
              Mevcut kiti kaydet ve devam et
            </Button>
            <Button size="sm" variant="light" onClick={() => apply(confirm, false)}>
              Üzerine yaz
            </Button>
            <Button size="sm" variant="ghost" className="text-ivory hover:bg-ivory/10" onClick={() => setConfirm(null)}>
              Vazgeç
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
