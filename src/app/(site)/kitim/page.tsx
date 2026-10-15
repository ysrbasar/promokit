import type { Metadata } from "next";
import { KitWorkspace } from "@/components/kit/KitWorkspace";
import { NewKitButton, SavedKits } from "@/components/kit/SavedKits";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Kitim", robots: { index: false } };

export default function MyKitPage() {
  return (
    <Container className="max-w-4xl pb-28 pt-28 sm:pt-32">
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">Kit çalışma alanı</p>
        <NewKitButton />
      </div>
      <KitWorkspace />
      <SavedKits />
    </Container>
  );
}
