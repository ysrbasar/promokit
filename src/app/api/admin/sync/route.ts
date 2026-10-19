import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { readSyncStatus, runSync } from "@/lib/import/sync";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  return NextResponse.json({ status: await readSyncStatus() });
}

/** Katalogu tedarikçi XML'inden hemen yeniler */
export async function POST() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const status = await runSync();
  return NextResponse.json({ status }, { status: status.ok ? 200 : 502 });
}
