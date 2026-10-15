import { KitsEditor } from "@/components/admin/KitsEditor";
import { getCatalog, getReadyKits, getSettings } from "@/lib/server/repositories";

export default async function AdminKits() {
  const [kits, { products }, settings] = await Promise.all([getReadyKits(), getCatalog(), getSettings()]);
  return (
    <div className="max-w-5xl">
      <h1 className="text-4xl">Hazır kitler</h1>
      <p className="mt-2 text-sm text-muted">Kitler gerçek ürün kodlarına bağlanır. Stoğu yetersiz ürün sitede otomatik olarak benzer ürünle değiştirilir; katalogda olmayan kodlar öneri kuralıyla tamamlanır.</p>
      <div className="mt-8">
        <KitsEditor initial={kits} products={products.map((p) => ({ code: p.productCode, name: p.name }))} budgetKeys={settings.budgetTiers.map((b) => ({ key: b.key, label: b.label }))} />
      </div>
    </div>
  );
}
