import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentResult } from "@/components/payment/PaymentResult";
import { Container, Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Ödeme sonucu", robots: { index: false } };

export default function PaymentResultPage() {
  return (
    <Container className="max-w-2xl pb-28 pt-28 sm:pt-32">
      <Suspense fallback={<Skeleton className="h-72" />}>
        <PaymentResult />
      </Suspense>
    </Container>
  );
}
