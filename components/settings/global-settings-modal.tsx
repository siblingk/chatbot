"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SettingsModal } from "./settings-modal";
import { getSettings } from "@/app/actions/settings";
import { getUsers } from "@/app/actions/users";
import { getShops } from "@/app/actions/shops";
import { getAgents, updateAgent, deleteAgent } from "@/app/actions/agents";
import { useSettingsModal } from "@/contexts/settings-modal-context";
import { Setting } from "@/types/settings";
import { User } from "@/app/actions/users";
import { Shop } from "@/types/shops";
import { Agent } from "@/types/agents";
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
  const [agents, setAgents] = useState<Agent[]>([]);
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

        // Obtener agentes de Supabase
        const agentsData = await getAgents();
        setAgents(agentsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setHasError(true);
      toast.error(t("settings.errorLoading"));
    } finally {
      isFetchingRef.current = false;
    }
  }, [isAdmin, t]);

  // Manejadores para las acciones de agentes
  const handleUpdateAgent = useCallback(async (agent: Agent) => {
    try {
      await updateAgent(agent);

      // Actualizamos el estado local
      setAgents((prevAgents) => {
        const index = prevAgents.findIndex((a) => a.id === agent.id);
        if (index >= 0) {
          const newAgents = [...prevAgents];
          newAgents[index] = agent;
          return newAgents;
        }
        return [...prevAgents, agent];
      });

      return Promise.resolve();
    } catch (error) {
      console.error("Error al actualizar agente:", error);
      return Promise.reject(error);
    }
  }, []);

  const handleDeleteAgent = useCallback(async (agentId: string) => {
    try {
      await deleteAgent(agentId);

      // Actualizamos el estado local
      setAgents((prevAgents) => prevAgents.filter((a) => a.id !== agentId));

      return Promise.resolve();
    } catch (error) {
      console.error("Error al eliminar agente:", error);
      return Promise.reject(error);
    }
  }, []);

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
      settingsColumns={createSettingsColumns(tSettings)}
      userColumns={createUserColumns(tUsers)}
      agentConfig={{ agents }}
      onUpdateAgents={handleUpdateAgent}
      onDeleteAgent={handleDeleteAgent}
      hasError={hasError}
      onRetry={fetchData}
    />
  );
}
