"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { LiteProduct } from "@/lib/catalog/lite";
import { ProductImage } from "../product/ProductImage";
import { ButtonLink, Icon } from "../ui/primitives";
import { EASE } from "../ui/motion";

/**
 * Hero: koyu, dramatik zemin üzerinde katmanlı kit kompozisyonu.
 * Kompozisyon temsilidir (gerçek ürün fotoğrafı değildir); kartlar katalogdaki ürünlerdir.
 */
export function HeroSection({ products }: { products: LiteProduct[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yBack = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const yMid = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const yFront = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [a, b, c, d] = products;
  const word = { hidden: { y: "110%" }, show: { y: "0%" } };

  return (
    <section ref={ref} className="dark-surface relative isolate overflow-hidden bg-ink text-ivory">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -left-40 top-[-20%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgb(196_164_106/0.18),transparent_65%)]" />
        <div className="absolute right-[-10%] bottom-[-30%] h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgb(42_50_69/0.9),transparent_70%)]" />
        <div className="grain absolute inset-0 opacity-30" />
      </div>

      <div className="mx-auto grid min-h-[100svh] max-w-[1320px] items-center gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-10 lg:pt-28">
        <motion.div style={{ opacity: fade }}>
          <motion.p className="eyebrow mb-7" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            Kurumsal hediye kitleri
          </motion.p>
          <h1 className="text-[3.1rem] font-light leading-[0.98] sm:text-7xl lg:text-[5.6rem]">
            <motion.span className="block" initial="hidden" animate="show" transition={{ staggerChildren: 0.08, delayChildren: 0.15 }}>
              {["Markanıza", "özel", "kitler."].map((w) => (
                <span key={w} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <motion.span className="inline-block" variants={word} transition={{ duration: 1, ease: EASE }}>
                    {w}
                  </motion.span>
                </span>
              ))}
            </motion.span>
            <motion.span
              className="mt-2 block italic text-champagne"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.55, ease: EASE }}
            >
              Tek bir deneyimde.
            </motion.span>
          </h1>
          <motion.p
            className="mt-8 max-w-lg text-[1.02rem] leading-relaxed text-ivory/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            İhtiyacınızı anlatın, bütçenizi belirleyin, ürünlerinizi seçin. Kurumsal hediye kitinizi stoktaki gerçek ürünlerle birlikte oluşturalım.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1, ease: EASE }}
          >
            <ButtonLink href="/kit-olustur" variant="gold" size="lg">
              Kitimi Oluştur <Icon name="arrow" className="size-4" />
            </ButtonLink>
            <ButtonLink href="/hazir-kitler" variant="light" size="lg">
              Hazır Kitleri Keşfet
            </ButtonLink>
          </motion.div>
          <motion.dl
            className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-ivory/10 pt-6 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 1 }}
          >
            {[
              ["9 adım", "Sorularla kit"],
              ["Stoklu", "Gerçek ürünler"],
              ["Tek form", "Teklif talebi"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-display text-2xl text-champagne">{k}</dt>
                <dd className="mt-1 text-xs text-ivory/50">{v}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Katmanlı kompozisyon */}
        <div className="relative mx-auto aspect-square w-full max-w-[560px]" aria-label="Temsili kit kompozisyonu">
          <motion.div style={{ y: yBack }} className="absolute inset-[8%] rounded-[2rem] border border-champagne/25" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: EASE }} />
          <motion.div style={{ y: yBack }} className="absolute inset-[16%] rounded-[1.6rem] bg-gradient-to-br from-ink-3 to-ink-2 shadow-[0_60px_120px_-40px_rgb(0_0_0/0.8)]" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2, ease: EASE }}>
            <div className="absolute inset-x-0 top-1/2 h-px bg-champagne/40" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-champagne/40" />
            <div className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-champagne/60" />
          </motion.div>
          {[
            { p: a, cls: "left-[0%] top-[4%] w-[36%] -rotate-6", y: yMid, delay: 0.5 },
            { p: b, cls: "right-[0%] top-[12%] w-[34%] rotate-[5deg]", y: yFront, delay: 0.65 },
            { p: c, cls: "left-[12%] bottom-[0%] w-[34%] rotate-[4deg]", y: yFront, delay: 0.8 },
            { p: d, cls: "right-[4%] bottom-[6%] w-[32%] -rotate-[7deg]", y: yMid, delay: 0.95 },
          ].map(({ p, cls, y, delay }, i) =>
            p ? (
              <motion.div key={p.productCode} style={{ y }} className={`absolute ${cls}`} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay, ease: EASE }}>
                <Link href={`/urun/${p.slug}`} className="group block overflow-hidden rounded-2xl border border-ivory/10 bg-ink-2/80 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] backdrop-blur transition-transform duration-700 hover:-translate-y-2">
                  <ProductImage src={p.image} alt={p.name} category={p.category} tone="dark" className="aspect-square" priority={i < 2} sizes="220px" />
                  <span className="block truncate px-3 py-2.5 text-[0.7rem] text-ivory/70">{p.name}</span>
                </Link>
              </motion.div>
            ) : null,
          )}
        </div>
      </div>

      <motion.a
        href="#nasil"
        aria-label="Aşağı kaydır"
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-ivory/40 lg:flex"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        Keşfet
        <span className="h-10 w-px bg-gradient-to-b from-champagne to-transparent" />
      </motion.a>
    </section>
  );
}
