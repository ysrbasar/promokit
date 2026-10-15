"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Icon, cn } from "./primitives";

export function Accordion({ items, dark }: { items: { q: string; a: string }[]; dark?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();
  return (
    <div className={cn("divide-y border-y", dark ? "divide-ivory/10 border-ivory/10" : "divide-line border-line")}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q}>
            <h3 className="font-sans">
              <button
                type="button"
                id={`${id}-h-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-p-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-display text-xl sm:text-2xl">{it.q}</span>
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border transition-transform duration-500", dark ? "border-ivory/20" : "border-line-strong", isOpen && "rotate-45")}>
                  <Icon name="plus" className="size-4" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${id}-p-${i}`}
                  role="region"
                  aria-labelledby={`${id}-h-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className={cn("max-w-2xl pb-6 text-[0.95rem] leading-relaxed", dark ? "text-ivory/60" : "text-muted")}>{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
