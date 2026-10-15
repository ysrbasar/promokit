"use client";

import { MotionConfig, motion, useInView, useMotionValue, useSpring, useTransform, type Variants } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Uygulama genelinde hareket ayarı: kullanıcının "hareketi azalt" tercihine uyar */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.7, ease: EASE }}>
      {children}
    </MotionConfig>
  );
}

/** Kaydırma ile görünür olduğunda bir kez yumuşakça belirir */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </M>
  );
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-8% 0px" }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

/** Sayıların yumuşakça güncellenmesi (bütçe göstergesi vb.) */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 120, damping: 22 });
  const text = useTransform(spring, (n) => format(n));
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  useEffect(() => {
    mv.set(value);
  }, [mv, value]);
  useEffect(() => text.on("change", (t) => ref.current && (ref.current.textContent = t)), [text]);
  return (
    <span ref={ref} data-inview={inView}>
      {format(value)}
    </span>
  );
}
