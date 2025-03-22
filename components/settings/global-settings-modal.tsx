"use client";
import { SettingsModal } from "./settings-modal";

import { useTranslations } from "next-intl";

import { createUserColumns } from "../users/user-columns";
import { createSettingsColumns } from "./columns";

export function GlobalSettingsModal() {
  const tSettings = useTranslations("settings");
  const tUsers = useTranslations("users");

  return (
    <SettingsModal
      settingsColumns={createSettingsColumns(tSettings)}
      userColumns={createUserColumns(tUsers)}
      settings={[]}
    />
  );
}
