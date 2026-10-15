import Link from "next/link";
import { isProductEligible } from "@/lib/catalog/stock";
import { getCatalog, getImportReport, getReadyKits, getSettings } from "@/lib/server/repositories";
import { listQuotes } from "@/lib/server/quotes";

export default async function AdminHome() {
  const [{ products, info }, settings, quotes, kits, report] = await Promise.all([getCatalog(), getSettings(), listQuotes(), getReadyKits(), getImportReport()]);
  const stats = [
    ["Katalog kaynağı", info.kind === "demo" ? "ÖRNEK VERİ" : "İçe aktarılan", info.kind === "demo" ? "Gerçek katalog içe aktarılmadı" : new Date(info.generatedAt).toLocaleString("tr-TR")],
    ["Toplam ürün", String(products.length), `${products.filter((p) => !p.isActive).length} pasif`],
    ["Stok filtresinden geçen", String(products.filter((p) => isProductEligible(p, settings.minStock)).length), `eşik ${settings.minStock}+`],
    ["Görseli olmayan", String(products.filter((p) => !p.imageOriginalUrl && !p.localImagePath).length), ""],
    ["Hazır kit", String(kits.length), ""],
    ["Yeni teklif talebi", String(quotes.filter((q) => q.status === "new").length), `toplam ${quotes.length}`],
  ];
  return (
    <div>
      <h1 className="text-4xl">Genel bakış</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([k, v, s]) => (
          <div key={k} className="rounded-card border border-line bg-paper p-6">
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-2 font-display text-4xl">{v}</p>
            {s && <p className="mt-1 text-xs text-subtle">{s}</p>}
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-card border border-line bg-paper p-6 text-sm">
        <p className="font-semibold">Son veri toplama</p>
        <p className="mt-1 text-muted">{report ? `Rapor: ${new Date(String(report.generatedAt)).toLocaleString("tr-TR")}` : "Henüz veri toplama raporu yok."}</p>
        <Link href="/admin/veri" className="mt-3 inline-block underline decoration-champagne underline-offset-4">Veri kalitesi raporu</Link>
      </div>
      <p className="mt-8 text-xs text-muted">E-posta/CRM entegrasyonu yapılandırılmadı: teklif talepleri yalnızca bu panelde listelenir.</p>
    </div>
  );
}
