import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = { title: "İletişim", alternates: { canonical: "/iletisim" } };

export default function ContactPage() {
  const rows = [
    ["E-posta", COMPANY.email, COMPANY.email ? `mailto:${COMPANY.email}` : null],
    ["Telefon", COMPANY.phone, COMPANY.phone ? `tel:${COMPANY.phone.replace(/\s/g, "")}` : null],
    ["Adres", COMPANY.address, null],
  ] as const;
  const configured = rows.some(([, v]) => v);
  return (
    <>
      <PageHeader eyebrow="İletişim" title="Birlikte tasarlayalım" lead="Kitinizle ilgili en hızlı yol teklif formudur: kit içeriğiniz, adetleriniz ve tercihleriniz tek seferde bize ulaşır." />
      <Container className="grid gap-10 py-16 pb-28 lg:grid-cols-2">
        <div className="rounded-card bg-ink p-10 text-ivory">
          <p className="eyebrow">Teklif</p>
          <p className="mt-4 font-display text-4xl">Kitiniz hazırsa teklif isteyin</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/teklif" variant="gold">Teklif iste</ButtonLink>
            <ButtonLink href="/kit-olustur" variant="light">Kit oluştur</ButtonLink>
          </div>
        </div>
        <div className="rounded-card border border-line bg-paper p-10">
          <p className="eyebrow">İletişim bilgileri</p>
          {configured ? (
            <dl className="mt-6 divide-y divide-line">
              {rows.filter(([, v]) => v).map(([k, v, href]) => (
                <div key={k} className="grid grid-cols-[100px_1fr] gap-4 py-4 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd>{href ? <a href={href} className="underline decoration-champagne underline-offset-4">{v}</a> : v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-6 text-sm text-muted">İletişim bilgileri henüz yapılandırılmadı (NEXT_PUBLIC_CONTACT_* ortam değişkenleri). Bu sürede teklif formunu kullanabilirsiniz.</p>
          )}
        </div>
      </Container>
    </>
  );
}
