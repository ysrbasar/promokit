import type { Metadata } from "next";
import { QuoteFlow } from "@/components/quote/QuoteFlow";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Teklif İste", robots: { index: false } };

export default function QuotePage() {
  return (
    <Container className="max-w-3xl pb-28 pt-28 sm:pt-32">
      <p className="eyebrow">Teklif talebi</p>
      <h1 className="mt-4 text-5xl leading-tight sm:text-6xl">Kitiniz için teklif alın</h1>
      <p className="mt-4 text-muted">Ekibimiz stok, baskı ve termini tedarikçiyle doğrulayıp size yazılı teklif iletir. Bu formun gönderilmesi bir satın alma taahhüdü değildir.</p>
      <div className="mt-12">
        <QuoteFlow />
      </div>
    </Container>
  );
}
