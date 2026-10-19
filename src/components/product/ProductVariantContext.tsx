"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useContext, useState } from "react";
import { bestLiteVariant, type LiteProduct } from "@/lib/catalog/lite";
import { useCatalogInfo } from "../providers/CatalogContext";
import { cn } from "../ui/primitives";
import { ProductImage } from "./ProductImage";

/** Ürün sayfasında seçili varyant ve büyük görsel; galeri ile seçim alanı bunu paylaşır */
type Ctx = {
  variant: string | null;
  setVariant: (code: string | null) => void;
  image: string | null;
  setImage: (src: string | null) => void;
};
const VariantCtx = createContext<Ctx | null>(null);

export function useProductVariant() {
  return useContext(VariantCtx);
}

export function ProductVariantProvider({ product: p, children }: { product: LiteProduct; children: React.ReactNode }) {
  const { minStock } = useCatalogInfo();
  const [variant, setV] = useState<string | null>(() => bestLiteVariant(p, minStock)?.code ?? p.variants[0]?.code ?? null);
  const [image, setImage] = useState<string | null>(() => p.variants.find((v) => v.code === variant)?.image ?? p.image);
  const setVariant = (code: string | null) => {
    setV(code);
    const img = p.variants.find((v) => v.code === code)?.image;
    if (img) setImage(img);
  };
  return <VariantCtx.Provider value={{ variant, setVariant, image, setImage }}>{children}</VariantCtx.Provider>;
}

/** Büyük görsel + küçük resimler. Varyant seçilince o varyantın fotoğrafı büyük resme gelir. */
export function ProductGallery({ product: p }: { product: LiteProduct }) {
  const ctx = useProductVariant();
  const main = ctx?.image ?? p.image;
  const thumbs = [...new Set([p.image, ...p.gallery, ...p.variants.map((v) => v.image)].filter((x): x is string => !!x))].slice(0, 12);
  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-card border border-line bg-paper">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={main ?? "none"} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35 }}>
            <ProductImage key={main} src={main} alt={p.name} category={p.category} priority className="h-full" sizes="(min-width: 1024px) 50vw, 100vw" />
          </motion.div>
        </AnimatePresence>
      </div>
      {thumbs.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {thumbs.map((g, i) => (
            <button
              key={g}
              type="button"
              onClick={() => ctx?.setImage(g)}
              aria-label={`Görsel ${i + 1}`}
              aria-pressed={g === main}
              className={cn("overflow-hidden rounded-soft border-2 transition-all hover:-translate-y-0.5", g === main ? "border-champagne shadow-gold" : "border-line hover:border-line-strong")}
            >
              <ProductImage src={g} alt="" category={p.category} className="aspect-square" sizes="90px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
