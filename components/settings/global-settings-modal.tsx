"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SettingsModal } from "./settings-modal";
import { getSettings } from "@/app/actions/settings";
import { getUsers } from "@/app/actions/users";
import { getShops } from "@/app/actions/shops";
import { getUserOrganizations } from "@/app/actions/organizations";
import { useSettingsModal } from "@/contexts/settings-modal-context";
import { Setting } from "@/types/settings";
import { User } from "@/app/actions/users";
import { Shop } from "@/types/shops";
import { OrganizationWithRole } from "@/types/organization";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useUserRole } from "@/hooks/useUserRole";

import { createUserColumns } from "../users/user-columns";
import { createSettingsColumns } from "./columns";

export function GlobalSettingsModal() {
  const { isOpen, activeTab } = useSettingsModal();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>(
    []
  );
  const [hasError, setHasError] = useState(false);
  const t = useTranslations();
  const tSettings = useTranslations("settings");
  const tUsers = useTranslations("users");
  const isFetchingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isAdmin } = useUserRole();

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setHasError(false);

    try {
      // Obtener configuraciones
      const settingsData = await getSettings();
      setSettings(settingsData);

      // Obtener usuarios si es administrador
      if (isAdmin) {
        const usersData = await getUsers();
        setUsers(usersData);

        // Obtener tiendas
        const shopsData = await getShops();
        setShops(shopsData);

        // Obtener organizaciones
        const organizationsData = await getUserOrganizations();
        setOrganizations(organizationsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setHasError(true);
      toast.error(t("settings.errorLoading"));
    } finally {
      isFetchingRef.current = false;
    }
  }, [isAdmin, t]);

  // Cargar datos cuando se abre el modal o cambia la pestaña
  useEffect(() => {
    if (isOpen) {
      // Limpiar el timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Establecer un pequeño retraso para evitar múltiples llamadas
      timeoutRef.current = setTimeout(() => {
        fetchData();
      }, 100);
    }

    // Limpiar el timeout al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, activeTab, fetchData]);

  return (
    <SettingsModal
      settings={settings}
      users={users}
      shops={shops}
      organizations={organizations}
      settingsColumns={createSettingsColumns(tSettings)}
      userColumns={createUserColumns(tUsers)}
      hasError={hasError}
      onRetry={fetchData}
    />
  );
}
