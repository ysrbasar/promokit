import type { ReactNode } from "react";
import { Container } from "../ui/primitives";
import { Reveal } from "../ui/motion";

export function PageHeader({ eyebrow, title, lead, children, dark }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; children?: ReactNode; dark?: boolean }) {
  return (
    <section className={dark ? "dark-surface relative overflow-hidden bg-ink pb-16 pt-36 text-ivory sm:pb-20 sm:pt-40" : "relative border-b border-line pb-12 pt-32 sm:pb-16 sm:pt-36"}>
      {dark && <div aria-hidden className="absolute -right-40 -top-40 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(196_164_106/0.16),transparent_65%)]" />}
      <Container className="relative">
        <Reveal>
          {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
          <h1 className="max-w-4xl text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">{title}</h1>
          {lead && <p className={`mt-6 max-w-2xl text-[1rem] leading-relaxed ${dark ? "text-ivory/65" : "text-muted"}`}>{lead}</p>}
          {children}
        </Reveal>
      </Container>
    </section>
  );
}
