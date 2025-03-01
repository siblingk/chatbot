"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAgents, updateAgent, deleteAgent } from "@/app/actions/agents";
import { Agent, AgentConfig } from "@/types/agents";
import { useAuth } from "@/contexts/auth-context";
import { useUserRole } from "@/hooks/useUserRole";
import { AgentsTab } from "@/components/settings/agents-tab";
import { toast } from "sonner";
import { redirect } from "next/navigation";

export default function AgentsPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const t = useTranslations();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si el usuario es administrador o si está accediendo a su propia página
    if (!isAdmin && user?.id !== userId) {
      redirect("/");
    }

    const fetchAgents = async () => {
      setLoading(true);
      try {
        const agentsData = await getAgents();
        setAgents(agentsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError(t("settings.errorLoading"));
        toast.error(t("settings.errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [userId, user, isAdmin, t]);

  const handleUpdateAgent = async (agent: Agent): Promise<void> => {
    try {
      await updateAgent(agent);
      // Actualizar la lista de agentes
      setAgents((prevAgents) =>
        prevAgents.map((a) => (a.id === agent.id ? agent : a))
      );
      toast.success(t("settings.agentUpdated"));
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error(t("settings.errorUpdatingAgent"));
    }
  };

  const handleDeleteAgent = async (agentId: string): Promise<void> => {
    try {
      await deleteAgent(agentId);
      // Eliminar el agente de la lista
      setAgents((prevAgents) => prevAgents.filter((a) => a.id !== agentId));
      toast.success(t("settings.agentDeleted"));
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error(t("settings.errorDeletingAgent"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          {t("settings.retry")}
        </button>
      </div>
    );
  }

  const agentConfig: AgentConfig = {
    agents: agents,
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">{t("settings.agents")}</h1>
      <div className="bg-card rounded-lg shadow-sm p-6">
        <AgentsTab
          agentConfig={agentConfig}
          onUpdateAgents={handleUpdateAgent}
          onDeleteAgent={handleDeleteAgent}
        />
      </div>
    </div>
  );
}
