"use client";

import { Button, Container } from "@/components/ui/primitives";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="pb-28 pt-40 text-center">
      <p className="eyebrow">Bir sorun oluştu</p>
      <h1 className="mt-4 text-5xl">Sayfa yüklenemedi</h1>
      <p className="mt-4 text-muted">Lütfen tekrar deneyin. Sorun sürerse teklif formundan bize ulaşabilirsiniz.</p>
      <Button className="mt-8" onClick={reset}>Tekrar dene</Button>
    </Container>
  );
}
