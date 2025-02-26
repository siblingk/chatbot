"use client";

import { useEffect, useState, useCallback } from "react";
import { SettingsModal } from "./settings-modal";
import { getSettings } from "@/app/actions/settings";
import { getUsers } from "@/app/actions/users";
import { Setting } from "@/types/settings";
import { User } from "@/app/actions/users";
import { ColumnDef } from "@tanstack/react-table";
import { useSettingsModal } from "@/contexts/settings-modal-context";
import { useTranslations } from "next-intl";

export function GlobalSettingsModal() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen } = useSettingsModal();
  const t = useTranslations("settings");

  // Definimos las columnas para la tabla de configuración
  const settingsColumns: ColumnDef<Setting>[] = [
    {
      accessorKey: "workshop_id",
      header: t("workshopId"),
    },
    {
      accessorKey: "workshop_name",
      header: t("workshopName"),
    },
    {
      accessorKey: "interaction_tone",
      header: t("interactionTone"),
    },
  ];

  // Función para cargar datos
  const fetchData = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    try {
      const [settingsData, usersData] = await Promise.all([
        getSettings(),
        getUsers(),
      ]);

      setSettings(settingsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error loading settings data:", error);
      // En caso de error, aseguramos que los arrays estén vacíos
      setSettings([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  // Efecto para cargar datos cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Solo renderizamos el modal si está abierto
  if (!isOpen) return null;

  return (
    <SettingsModal
      settings={settings}
      users={users}
      settingsColumns={settingsColumns}
      isLoading={isLoading}
    />
  );
}
