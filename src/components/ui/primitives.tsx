import Link from "next/link";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ComponentProps, ReactNode } from "react";

export const cn = (...a: Parameters<typeof clsx>) => twMerge(clsx(...a));

type Variant = "primary" | "gold" | "outline" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-ink-2 shadow-[0_8px_24px_-12px_rgb(14_21_37/0.6)]",
  gold: "bg-champagne text-ink hover:bg-champagne-light shadow-gold",
  outline: "border border-line-strong text-ink hover:border-ink hover:bg-ink hover:text-ivory",
  ghost: "text-ink hover:bg-stone/70",
  light: "border border-ivory/30 text-ivory hover:bg-ivory hover:text-ink",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.8rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[0.95rem]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide whitespace-nowrap",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-lux)]",
    "active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function Button({ variant, size, className, ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button {...rest} className={buttonClass(variant, size, className)} />;
}

export function ButtonLink({ variant, size, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...rest} className={buttonClass(variant, size, className)} />;
}

export function Container({ className, ...rest }: ComponentProps<"div">) {
  return <div {...rest} className={cn("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10", className)} />;
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="text-4xl leading-[1.05] sm:text-5xl lg:text-[3.5rem]">{title}</h2>
      {lead && <p className="mt-5 text-[0.95rem] leading-relaxed text-muted dark-lead">{lead}</p>}
    </div>
  );
}

export function Badge({ tone = "neutral", className, ...rest }: ComponentProps<"span"> & { tone?: "neutral" | "gold" | "success" | "warning" | "danger" | "dark" }) {
  const tones = {
    neutral: "bg-stone text-ink-3",
    gold: "bg-champagne-light/60 text-gold-deep",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    dark: "bg-ink text-ivory",
  };
  return (
    <span
      {...rest}
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide", tones[tone], className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-card", className)} />;
}

export function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-5", className)}>
      {ICONS[name]}
    </svg>
  );
}

const ICONS = {
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  box: (
    <>
      <path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z" />
      <path d="M3.5 8L12 12.5 20.5 8M12 12.5v8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" />
    </>
  ),
  swap: <path d="M7 7h11l-3-3M17 17H6l3 3" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  save: <path d="M5 4h11l3 3v13H5zM8 4v5h7M8 20v-6h8v6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" />,
} as const;
