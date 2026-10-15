import type { Metadata } from "next";
import { Reveal } from "@/components/ui/motion";
import { ButtonLink, Container, Icon } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Talebiniz alındı", robots: { index: false } };

export default async function QuoteSuccess({ searchParams }: { searchParams: Promise<{ no?: string }> }) {
  const { no } = await searchParams;
  const id = no && /^T-\d{8}-[A-Z0-9]{6}$/.test(no) ? no : null;
  return (
    <Container className="max-w-2xl pb-28 pt-36 text-center">
      <Reveal>
        <span className="mx-auto grid size-20 place-items-center rounded-full border border-champagne bg-ink text-champagne shadow-gold">
          <Icon name="check" className="size-8" />
        </span>
        <p className="eyebrow mt-10">Teşekkürler</p>
        <h1 className="mt-4 text-5xl leading-tight sm:text-6xl">Talebiniz alındı</h1>
        {id && (
          <p className="mt-6 text-sm text-muted">
            Talep numaranız <span className="font-mono font-semibold text-ink">{id}</span>
          </p>
        )}
        <p className="mx-auto mt-6 max-w-lg leading-relaxed text-muted">
          Talebiniz sistemimize kaydedildi. Ekibimiz stok, baskı ve termin bilgilerini doğruladıktan sonra sizinle iletişime geçecek. Otomatik e-posta bildirimi henüz etkin değildir; bu nedenle ayrıca bir onay e-postası almayabilirsiniz.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/kitim" variant="outline">
            Kitimi görüntüle
          </ButtonLink>
          <ButtonLink href="/">Ana sayfaya dön</ButtonLink>
        </div>
      </Reveal>
    </Container>
  );
}
