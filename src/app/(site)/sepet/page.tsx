import type { Metadata } from "next";
import { QuoteFlow } from "@/components/quote/QuoteFlow";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Sepet", robots: { index: false } };

export default function CartPage() {
  return (
    <Container className="max-w-3xl pb-28 pt-28 sm:pt-32">
      <p className="eyebrow">Tekli sipariş</p>
      <h1 className="mt-4 text-5xl leading-tight sm:text-6xl">Sepetiniz</h1>
      <p className="mt-4 text-muted">
        Kit oluşturmadan tek tek ürün sipariş edebilirsiniz. Online ödeme alınmaz: sepetiniz sipariş talebi olarak bize ulaşır, stok, baskı ve teslimatı doğrulayıp size yazılı teklif ve ödeme bilgisi iletiriz. Fiyatlara KDV dahil değildir.
      </p>
      <div className="mt-12">
        <QuoteFlow mode="cart" />
      </div>
    </Container>
  );
}
