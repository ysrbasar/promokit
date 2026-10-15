import { SettingsForm } from "@/components/admin/AdminWidgets";
import { getSettings } from "@/lib/server/repositories";

export default async function AdminSettings() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl">Ayarlar</h1>
      <div className="mt-8">
        <SettingsForm settings={await getSettings()} />
      </div>
    </div>
  );
}
