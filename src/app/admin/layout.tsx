import type { Metadata } from "next";
import Link from "next/link";
import { AdminLogout } from "@/components/admin/AdminLogout";
import { Logo } from "@/components/layout/Logo";
import { isAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Yönetim", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Genel bakış" },
  { href: "/admin/urunler", label: "Ürünler" },
  { href: "/admin/kitler", label: "Hazır kitler" },
  { href: "/admin/teklifler", label: "Teklif talepleri" },
  { href: "/admin/veri", label: "Veri kalitesi" },
  { href: "/admin/ayarlar", label: "Ayarlar" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) return <main className="min-h-dvh bg-stone/50">{children}</main>;
  return (
    <div className="min-h-dvh bg-stone/40 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="dark-surface bg-ink p-6 text-ivory lg:sticky lg:top-0 lg:h-dvh">
        <Link href="/" className="block">
          <Logo />
        </Link>
        <p className="eyebrow mt-6">Yönetim paneli</p>
        <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Yönetim menüsü">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-soft px-3 py-2 text-sm text-ivory/70 hover:bg-ivory/10 hover:text-ivory">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8">
          <AdminLogout />
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8 lg:p-12">{children}</main>
    </div>
  );
}
