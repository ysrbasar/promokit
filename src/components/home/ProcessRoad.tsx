"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { CategoryIcon } from "../ui/CategoryIcon";
import { cn } from "../ui/primitives";

export type RoadStep = { title: string; text: string; icon: string; anim: string; note?: string };

/**
 * Süreç yolu: ortada kesikli şeridi akan bir yol, sayfa kaydırıldıkça altın renkle dolar.
 * Her durak hareketli bir ikonla işaretlenir; kartlar yolun iki yanına sırayla dizilir (mobilde tek yan).
 */
export function ProcessRoad({ steps }: { steps: RoadStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <ol ref={ref} className="relative mx-auto max-w-5xl">
      {/* Yol */}
      <div aria-hidden className="absolute bottom-0 left-8 top-0 w-10 -translate-x-1/2 rounded-full bg-ink md:left-1/2">
        <div className="road-dash absolute inset-y-3 left-1/2 w-1 -translate-x-1/2 rounded-full opacity-70" />
        <motion.div style={{ scaleY: fill }} className="absolute inset-0 origin-top rounded-full bg-gradient-to-b from-champagne/50 to-champagne/10" />
      </div>

      {steps.map((s, i) => {
        const right = i % 2 === 1;
        return (
          <li key={s.title} className="relative grid min-h-48 grid-cols-[4rem_1fr] items-center gap-6 py-8 md:grid-cols-[1fr_6rem_1fr] md:gap-0">
            {/* Durak */}
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="relative z-10 col-start-1 row-start-1 grid size-16 place-items-center justify-self-center rounded-full border-4 border-ivory bg-champagne text-ink shadow-[0_0_0_6px_rgb(196_164_106/0.25)] md:col-start-2"
            >
              <CategoryIcon name={s.icon} className={cn("size-8", s.anim)} />
              <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-ink font-display text-xs font-bold text-champagne">{i + 1}</span>
            </motion.span>

            {/* Kart */}
            <motion.div
              initial={{ opacity: 0, x: right ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "col-start-2 row-start-1 rounded-card border border-line bg-paper p-6 shadow-card transition-shadow hover:shadow-lift",
                right ? "md:col-start-3 md:ml-6" : "md:col-start-1 md:mr-6 md:text-right",
              )}
            >
              <p className="eyebrow">Adım {i + 1}</p>
              <h2 className="mt-2 text-3xl">{s.title}</h2>
              <p className="mt-2 text-muted">{s.text}</p>
              {s.note && <p className="mt-3 text-xs font-semibold text-gold-deep">{s.note}</p>}
            </motion.div>
          </li>
        );
      })}

      {/* Varış */}
      <li className="relative grid grid-cols-[4rem_1fr] items-center gap-6 pt-6 md:grid-cols-[1fr_6rem_1fr] md:gap-0">
        <span className="relative z-10 col-start-1 grid size-20 place-items-center justify-self-center rounded-2xl bg-ink text-champagne shadow-gold md:col-start-2">
          <CategoryIcon name="hediye-set" className="anim-pop size-10" />
        </span>
        <p className="col-start-2 font-display text-2xl md:col-start-3 md:ml-6">Kitleriniz teslim edildi.</p>
      </li>
    </ol>
  );
}
