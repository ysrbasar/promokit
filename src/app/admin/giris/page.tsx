import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Logo } from "@/components/layout/Logo";
import { adminConfigured, isAdmin } from "@/lib/auth/admin";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-paper p-8 shadow-lift">
        <Logo />
        <h1 className="mt-8 text-3xl">Yönetim paneli</h1>
        <p className="mb-6 mt-2 text-sm text-muted">Devam etmek için yönetici parolanızı girin.</p>
        <AdminLogin configured={adminConfigured()} />
      </div>
    </div>
  );
}
