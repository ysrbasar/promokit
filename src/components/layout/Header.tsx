"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { useKit, useHydrated } from "@/lib/kit/store";
import { ButtonLink, Icon, cn } from "../ui/primitives";
import { CategoryIcon } from "../ui/CategoryIcon";
import { Logo } from "./Logo";

const NAV = [
  { href: "/hazir-kitler", label: "Hazır Kitler", icon: "hediye-set" },
  { href: "/katalog", label: "Ürün Kataloğu", icon: "diger" },
  { href: "/kurumsal-surec", label: "Süreç", icon: "takvim" },
  { href: "/sss", label: "SSS", icon: "education" },
  { href: "/iletisim", label: "İletişim", icon: "client" },
];

export function Header() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const count = useKit((s) => s.draft.lines.length);
  const favCount = useKit((s) => s.favorites.length);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));
  useEffect(() => setOpen(false), [pathname]);

  const overHero = pathname === "/" && !scrolled && !open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-500",
        overHero ? "bg-transparent text-ivory" : "bg-ivory/85 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label="PromoKit ana sayfa" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Ana menü" className="ml-6 hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "group relative flex items-center gap-1.5 text-[0.84rem] font-semibold tracking-wide opacity-80 transition-opacity hover:opacity-100",
                pathname.startsWith(n.href) && "opacity-100 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:bg-champagne",
              )}
            >
              <CategoryIcon name={n.icon} className="size-4 text-champagne transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-125" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/favoriler" aria-label={`Favoriler (${hydrated ? favCount : 0})`} className="relative hidden size-10 place-items-center rounded-full hover:bg-ink/5 sm:grid">
            <Icon name="heart" />
            {hydrated && favCount > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-champagne" />}
          </Link>
          <Link href="/kitim" aria-label={`Kitim, ${hydrated ? count : 0} ürün`} className="relative grid size-10 place-items-center rounded-full hover:bg-ink/5">
            <Icon name="box" />
            <AnimatePresence>
              {hydrated && count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-champagne text-[0.65rem] font-bold text-ink"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <ButtonLink href="/kit-olustur" variant={overHero ? "gold" : "primary"} size="sm" className="hidden sm:inline-flex">
            Kit Oluştur
          </ButtonLink>
          <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-ink/5 lg:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label="Menü" onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobil menü"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-ivory text-ink lg:hidden"
          >
            <div className="flex flex-col px-4 pb-6 pt-2 sm:px-6">
              {[{ href: "/kit-olustur", label: "Kit Oluştur" }, ...NAV, { href: "/favoriler", label: "Favoriler" }, { href: "/kitim", label: "Kitim" }].map((n, i) => (
                <motion.div key={n.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link href={n.href} className="flex items-center justify-between border-b border-line py-4 font-display text-2xl">
                    {n.label}
                    <Icon name="arrow" className="size-4 text-champagne" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
