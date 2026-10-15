import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/ui/primitives";
import { FAQ } from "@/lib/content/faq";

export const metadata: Metadata = { title: "Sık Sorulan Sorular", alternates: { canonical: "/sss" } };

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHeader eyebrow="SSS" title="Sık sorulan sorular" />
      <Container className="max-w-4xl py-16 pb-28">
        <Accordion items={FAQ} />
      </Container>
    </>
  );
}
