import type { ReactNode } from "react";

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-3xl space-y-5 text-[0.98rem] leading-relaxed text-ink-3 [&_h2]:mt-12 [&_h2]:text-3xl [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_a]:underline [&_a]:decoration-champagne [&_a]:underline-offset-4 [&_strong]:text-ink">
      {children}
    </div>
  );
}

export function LegalDraftNotice() {
  return (
    <p role="note" className="rounded-card border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
      Bu metin bir şablondur. Yayına almadan önce şirket bilgileriyle doldurulmalı ve hukuk danışmanınız tarafından gözden geçirilmelidir.
    </p>
  );
}
