import { ButtonLink, Container } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Container className="pb-28 pt-40 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-5xl sm:text-6xl">Aradığınız sayfa bulunamadı</h1>
      <p className="mt-4 text-muted">Ürün katalogdan kaldırılmış ya da bağlantı değişmiş olabilir.</p>
      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/katalog" variant="outline">Kataloğa git</ButtonLink>
        <ButtonLink href="/">Ana sayfa</ButtonLink>
      </div>
    </Container>
  );
}
