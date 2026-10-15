"use client";

import { useRouter } from "next/navigation";

export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-xs text-ivory/50 underline underline-offset-4 hover:text-champagne"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/giris");
        router.refresh();
      }}
    >
      Çıkış yap
    </button>
  );
}
