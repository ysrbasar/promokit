"use client";

import { AnimatePresence, motion } from "motion/react";
import { useKit, useHydrated } from "@/lib/kit/store";
import { Button, Icon } from "../ui/primitives";

export function SavedKits() {
  const hydrated = useHydrated();
  const saved = useKit((s) => s.saved);
  const currentId = useKit((s) => s.draft.id);
  const { openSaved, deleteSaved } = useKit();
  if (!hydrated || saved.length === 0) return null;
  return (
    <section aria-labelledby="kayitli" className="mt-16">
      <h2 id="kayitli" className="eyebrow mb-5">
        Kayıtlı kitlerim ({saved.length})
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {saved.map((k) => (
            <motion.li key={k.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="flex items-center gap-4 rounded-card border border-line bg-paper p-4">
              <Icon name="box" className="size-6 shrink-0 text-champagne" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl">{k.name}</p>
                <p className="text-xs text-muted">
                  {k.lines.length} ürün · {k.kitQuantity} kit · {new Date(k.updatedAt).toLocaleDateString("tr-TR")}
                  {k.id === currentId && " · açık"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openSaved(k.id)} disabled={k.id === currentId}>
                Aç
              </Button>
              <button type="button" onClick={() => deleteSaved(k.id)} className="grid size-9 place-items-center rounded-full text-subtle hover:bg-danger/10 hover:text-danger" aria-label={`${k.name} kaydını sil`}>
                <Icon name="trash" className="size-4" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

export function NewKitButton() {
  const hydrated = useHydrated();
  const count = useKit((s) => s.draft.lines.length);
  const { reset, saveCurrent } = useKit();
  if (!hydrated || count === 0) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        saveCurrent();
        reset();
      }}
    >
      <Icon name="plus" className="size-4" /> Kaydet ve yeni kit başlat
    </Button>
  );
}
