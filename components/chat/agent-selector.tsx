"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Agent } from "@/types/agents";
import { getAgents } from "@/app/actions/agents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, RefreshCw } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentSelectorProps {
  currentAgentId?: string;
  onAgentChange: (agentId: string) => void;
}

export function AgentSelector({
  currentAgentId,
  onAgentChange,
}: AgentSelectorProps) {
  const t = useTranslations();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = useUserRole();

  const isSuperAdmin = role === "super_admin";

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener todos los agentes disponibles
      // Para administradores: no filtrar por activos ni por rol
      const isAdminOrSuperAdmin = role === "admin" || role === "super_admin";
      const onlyActive = !isAdminOrSuperAdmin;
      const filterByRole = !isAdminOrSuperAdmin;

      console.log("AgentSelector - Cargando agentes con parámetros:");
      console.log("- Rol:", role);
      console.log("- onlyActive:", onlyActive);
      console.log("- filterByRole:", filterByRole);

      const agentsData = await getAgents(onlyActive, filterByRole);

      console.log(
        `AgentSelector - Se encontraron ${agentsData.length} agentes`
      );

      setAgents(agentsData);

      // Si no hay agents y es admin, mostrar error
      if (agentsData.length === 0 && isAdminOrSuperAdmin) {
        setError(
          "No se encontraron agentes, a pesar de tener permisos de administrador."
        );
      }
    } catch (error) {
      console.error("Error al cargar agentes:", error);
      setError("Error al cargar agentes. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [role]);

  const handleAgentChange = (value: string) => {
    onAgentChange(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center h-10 text-sm text-muted-foreground animate-pulse">
        <Bot className="h-4 w-4 mr-2" />
        {t("common.loading")}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col space-y-2">
        <div className="text-sm text-destructive">{error}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAgents}
          className="flex items-center"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-2" />
          {t("settings.refresh")}
        </Button>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground">
          {t("settings.noAgents")}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAgents}
          className="flex items-center"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-2" />
          {t("settings.refresh")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col space-y-1",
        isSuperAdmin && "bg-transparent p-0"
      )}
    >
      <div className="flex justify-between items-center">
        <label
          className={cn(
            "text-xs text-muted-foreground font-medium",
            isSuperAdmin && "font-medium text-foreground/70"
          )}
        >
          {t("chat.selectAgent") || "Selecciona agente"}
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadAgents}
          className={cn(
            "h-6 w-6 p-0",
            isSuperAdmin && "text-primary hover:text-primary/80"
          )}
        >
          <RefreshCw className="h-3 w-3" />
          <span className="sr-only">{t("settings.refresh")}</span>
        </Button>
      </div>
      <Select
        value={currentAgentId}
        onValueChange={handleAgentChange}
        disabled={isLoading}
      >
        <SelectTrigger
          className={cn(
            "h-10 text-sm bg-background/90 shadow-sm",
            "border-border/30 focus:border-primary/30",
            "focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
            isSuperAdmin &&
              "border-primary/20 focus:ring-primary/30 bg-transparent"
          )}
        >
          <SelectValue placeholder={t("chat.selectAgent")} />
        </SelectTrigger>
        <SelectContent className="max-h-[280px] overflow-y-auto shadow-md border-border/30">
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id} className="py-1.5">
              <div className="flex items-center gap-2">
                <Bot
                  className={cn(
                    "h-3.5 w-3.5",
                    agent.id === currentAgentId
                      ? "text-primary"
                      : "text-foreground/70"
                  )}
                />
                <span className="text-sm">{agent.name}</span>
                {agent.target_role !== "both" && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({agent.target_role})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div
        className={cn(
          "text-xs text-muted-foreground/60 mt-1 text-right pr-1",
          isSuperAdmin && "text-muted-foreground/70"
        )}
      >
        {agents.length} agentes disponibles
      </div>
    </div>
  );
}
