import type { Metadata } from "next";
import { KitBuilderWizard } from "@/components/kit/KitBuilderWizard";

export const metadata: Metadata = {
  title: "Kit Oluştur",
  description: "Birkaç soruyla amacınıza, bütçenize ve stilinize uygun, stoktaki ürünlerden oluşan kurumsal hediye kitinizi oluşturun.",
  alternates: { canonical: "/kit-olustur" },
};

export default function KitBuilderPage() {
  return <KitBuilderWizard />;
}
