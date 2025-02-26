"use client";

import { RequireAdmin } from "@/components/auth/require-admin";
import { SettingsTable } from "@/components/settings/settings-table";
import { Setting } from "@/types/settings";
import { ColumnDef } from "@tanstack/react-table";

interface SettingsPageClientProps {
  settings: Setting[];
  columns: ColumnDef<Setting>[];
}

export function SettingsPageClient({
  settings,
  columns,
}: SettingsPageClientProps) {
  return (
    <RequireAdmin>
      <div className="container py-10">
        <SettingsTable settings={settings} columns={columns} />
      </div>
    </RequireAdmin>
  );
}
