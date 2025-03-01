"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAgents, updateAgent, deleteAgent } from "@/app/actions/agents";
import { Agent, AgentConfig } from "@/types/agents";
import { useAuth } from "@/contexts/auth-context";
import { useUserRole } from "@/hooks/useUserRole";
import { AgentsTab } from "@/components/settings/agents-tab";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import { Bot, RefreshCw, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AgentsPage() {
  const { userId } = useParams();
  const router = useRouter();
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
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center gap-2 mb-8">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t("settings.agents")}</h1>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center gap-2 mb-8">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t("settings.agents")}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {t("settings.errorTitle")}
          </h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            {error}
          </p>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("settings.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const agentConfig: AgentConfig = {
    agents: agents,
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-row md:flex-row md:items-center gap-4 mb-8">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">{t("settings.agents")}</h1>
        {isAdmin && (
          <Badge variant="outline" className="ml-2 gap-1">
            <Shield className="h-3 w-3" />
            {t("settings.adminOnly")}
          </Badge>
        )}
      </div>

      <AgentsTab
        agentConfig={agentConfig}
        onUpdateAgents={handleUpdateAgent}
        onDeleteAgent={handleDeleteAgent}
      />
    </div>
  );
}
