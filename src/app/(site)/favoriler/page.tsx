import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { FavoritesGrid } from "@/components/product/FavoritesGrid";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Favoriler", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <>
      <PageHeader eyebrow="Favoriler" title="Beğendikleriniz" lead="Favorileriniz bu tarayıcıda saklanır." />
      <Container className="py-12 pb-28">
        <FavoritesGrid />
      </Container>
    </>
  );
}
