import { getSettings } from "@/app/actions/settings";
import { SettingsPageClient } from "./page.client";

export default async function SettingsPage() {
  const settings = await getSettings();

  return <SettingsPageClient settings={settings} />;
}
