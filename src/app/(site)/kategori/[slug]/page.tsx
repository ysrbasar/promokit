import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView, type CatalogSearchParams } from "@/components/catalog/CatalogView";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/primitives";
import { CATEGORIES } from "@/lib/config/taxonomy";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = CATEGORIES.find((x) => x.key === slug);
  if (!c) return {};
  return { title: c.label, description: `${c.label} kategorisindeki stoklu kurumsal hediye ve promosyon ürünleri.`, alternates: { canonical: `/kategori/${c.key}` } };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: Promise<CatalogSearchParams> }) {
  const { slug } = await params;
  const c = CATEGORIES.find((x) => x.key === slug);
  if (!c) notFound();
  return (
    <>
      <PageHeader eyebrow="Kategori" title={c.label} lead={c.hint} />
      <Container className="py-12 pb-28">
        <CatalogView searchParams={await searchParams} fixedCategory={c.key} basePath={`/kategori/${c.key}`} />
      </Container>
    </>
  );
}
