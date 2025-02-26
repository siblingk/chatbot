"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SettingsModal } from "./settings-modal";
import { getSettings } from "@/app/actions/settings";
import { getUsers } from "@/app/actions/users";
import { useSettingsModal } from "@/contexts/settings-modal-context";
import { Setting } from "@/types/settings";
import { User } from "@/app/actions/users";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useUserRole } from "@/hooks/useUserRole";

export function GlobalSettingsModal() {
  const { isOpen, activeTab } = useSettingsModal();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const t = useTranslations();
  const isFetchingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isAdmin } = useUserRole();

  // Función simplificada para obtener datos
  const fetchData = useCallback(async () => {
    // Evitar múltiples llamadas simultáneas o si el modal está cerrado
    if (isFetchingRef.current || !isOpen) return;

    // Solo cargar datos de configuración general y usuarios si el usuario es administrador
    if ((activeTab === "general" || activeTab === "users") && !isAdmin) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setHasError(false);

    try {
      if (activeTab === "general" && isAdmin) {
        const settingsData = await getSettings();
        setSettings(settingsData);
      } else if (activeTab === "users" && isAdmin) {
        const usersData = await getUsers();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setHasError(true);
      toast.error(t("settings.errorLoading"));
    } finally {
      setIsLoading(false);

      // Reseteamos la bandera después de un breve retraso
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        isFetchingRef.current = false;
        timeoutRef.current = null;
      }, 300);
    }
  }, [isOpen, activeTab, t, isAdmin]);

  // Efecto para cargar datos cuando cambia la pestaña o se abre el modal
  useEffect(() => {
    // Solo intentamos cargar datos si el modal está abierto
    if (!isOpen) return;

    fetchData();

    // Limpieza al desmontar el componente o cuando cambian las dependencias
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Asegurarse de que no queden peticiones pendientes
      isFetchingRef.current = false;
    };
  }, [isOpen, activeTab, fetchData]);

  // Definir columnas para la tabla de configuraciones
  const settingsColumns: ColumnDef<Setting>[] = [
    {
      accessorKey: "workshop_id",
      header: t("settings.workshopId"),
    },
    {
      accessorKey: "workshop_name",
      header: t("settings.workshopName"),
    },
    {
      accessorKey: "interaction_tone",
      header: t("settings.interactionTone"),
    },
  ];

  // Definir columnas para la tabla de usuarios
  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: t("users.email"),
    },
    {
      accessorKey: "role",
      header: t("users.role"),
    },
    {
      accessorKey: "status",
      header: t("users.status"),
    },
    {
      accessorKey: "created_at",
      header: t("users.createdAt"),
      cell: ({ row }) => {
        const createdAt = row.getValue("created_at");
        if (!createdAt) return "-";

        try {
          const date = new Date(createdAt as string);
          return date.toLocaleDateString();
        } catch (error) {
          console.error("Error formatting date:", error);
          return "-";
        }
      },
    },
  ];

  // Manejador para reintentar la carga de datos
  const handleRetry = useCallback(() => {
    if (!isFetchingRef.current) {
      fetchData();
    }
  }, [fetchData]);

  // Solo renderizamos el modal cuando está abierto para evitar problemas de renderizado
  if (!isOpen) return null;

  return (
    <SettingsModal
      settings={settings}
      users={users}
      settingsColumns={settingsColumns}
      userColumns={userColumns}
      isLoading={isLoading}
      hasError={hasError}
      onRetry={handleRetry}
    />
  );
}
