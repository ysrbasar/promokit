import type { Metadata } from "next";
import { CatalogView, type CatalogSearchParams } from "@/components/catalog/CatalogView";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Ürün Kataloğu",
  description: "Stoktaki promosyon ve kurumsal hediye ürünlerini ad veya ürün koduyla arayın, kategori, renk ve malzemeye göre filtreleyin.",
  alternates: { canonical: "/katalog" },
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return (
    <>
      <PageHeader eyebrow="Serbest kit oluşturma" title="Ürün kataloğu" lead="Kitinizi kendiniz kurun: ürünleri arayın, filtreleyin ve tek dokunuşla kitinize ekleyin. Stokta olmayan ürünler “Stokta yok” olarak işaretlidir. Fiyatlara KDV dahil değildir." />
      <Container className="py-12 pb-28">
        <CatalogView searchParams={await searchParams} basePath="/katalog" />
      </Container>
    </>
  );
}
