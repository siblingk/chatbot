"use client";

import { RequireAdmin } from "@/components/auth/require-admin";
import { SettingsTable } from "@/components/settings/settings-table";
import { Setting } from "@/types/settings";

interface SettingsPageClientProps {
  settings: Setting[];
}

export function SettingsPageClient({ settings }: SettingsPageClientProps) {
  return (
    <RequireAdmin>
      <div className="container py-10">
        <SettingsTable settings={settings} />
      </div>
    </RequireAdmin>
  );
}
