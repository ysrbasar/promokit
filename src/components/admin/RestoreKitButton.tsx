"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/primitives";

export function RestoreKitButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/admin/kits", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: slug }) });
        setBusy(false);
        router.refresh();
      }}
    >
      Geri getir
    </Button>
  );
}
