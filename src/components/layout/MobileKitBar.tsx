"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { totalPieces } from "@/lib/kit/kitState";
import { useKit, useHydrated } from "@/lib/kit/store";
import { useCatalogInfo } from "../providers/CatalogContext";
import { Icon, cn } from "../ui/primitives";

/** Mobilde her sayfada erişilebilir "Kitim" kısayolu */
export function MobileKitBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const draft = useKit((s) => s.draft);
  const { kind } = useCatalogInfo();
  const hidden = ["/kitim", "/teklif", "/kit-olustur", "/admin"].some((p) => pathname.startsWith(p));
  const show = hydrated && !hidden && draft.lines.length > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 90 }}
          animate={{ y: 0 }}
          exit={{ y: 90 }}
          className={cn("fixed inset-x-3 z-40 lg:hidden", kind === "demo" ? "bottom-10" : "bottom-3")}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <Link href="/kitim" className="flex items-center gap-3 rounded-full bg-ink px-5 py-3.5 text-ivory shadow-lift">
            <Icon name="box" className="text-champagne" />
            <span className="text-sm font-semibold">{draft.name}</span>
            <span className="text-xs text-ivory/60">
              {draft.lines.length} ürün · {totalPieces(draft)} parça
            </span>
            <span className="ml-auto text-xs font-semibold text-champagne">Görüntüle</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
