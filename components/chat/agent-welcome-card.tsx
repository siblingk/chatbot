"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSearchParams } from "next/navigation";
import { getUserPreferredAgent } from "@/app/actions/agents";
import { useTranslations } from "next-intl";
import { useUserRole } from "@/hooks/useUserRole";

interface AgentWelcomeCardProps {
  agentId?: string;
}

// Altura fija para evitar layout shifts
const CARD_MIN_HEIGHT = "120px";

// Componente memoizado para evitar re-renderizados innecesarios
const AgentWelcomeCard = memo(function AgentWelcomeCardInner({
  agentId,
}: AgentWelcomeCardProps) {
  const t = useTranslations("chat");
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const urlAgentId = searchParams.get("agentId") || undefined;
  const { isShop } = useUserRole();

  // Memoizar el ID efectivo del agente para evitar cálculos innecesarios
  const effectiveAgentId = useMemo(
    () => agentId || urlAgentId,
    [agentId, urlAgentId]
  );

  // Función para obtener la información del agente
  const fetchAgentInfo = useCallback(async () => {
    try {
      setIsLoading(true);

      // Obtener el agente preferido
      const preferredAgent = await getUserPreferredAgent(effectiveAgentId);

      if (preferredAgent) {
        // El agente es compatible por defecto ya que getUserPreferredAgent ya hace esta verificación
        if (preferredAgent.welcome_message) {
          setWelcomeMessage(preferredAgent.welcome_message);
          setAgentName(preferredAgent.name);
        } else {
          setWelcomeMessage(t("initialMessage"));
          setAgentName(preferredAgent.name);
        }
      } else {
        setWelcomeMessage(t("initialMessage"));
      }
    } catch {
      // Capturar cualquier error y usar el mensaje predeterminado
      setWelcomeMessage(t("initialMessage"));
    } finally {
      setIsLoading(false);
    }
  }, [effectiveAgentId, isShop, t]);

  // Efecto para cargar la información del agente solo cuando cambian las dependencias clave
  useEffect(() => {
    fetchAgentInfo();
  }, [fetchAgentInfo]);

  // Memoizar el mensaje a mostrar para evitar cálculos innecesarios
  const messageToShow = useMemo(
    () => welcomeMessage || t("initialMessage"),
    [welcomeMessage, t]
  );

  // Memoizar el nombre a mostrar
  const nameToShow = useMemo(
    () => agentName || "Welcome to siblingk",
    [agentName]
  );

  return (
    <div
      className="transition-opacity duration-200"
      style={{ minHeight: CARD_MIN_HEIGHT, opacity: isLoading ? 0.7 : 1 }}
    >
      <Card className="mb-6 bg-sidebar p-0 border-none shadow-sm font-normal tracking-wide rounded-none h-full">
        <CardHeader className="py-4">
          <CardTitle className="text-md flex items-center gap-2 text-primary">
            <Bot className="h-5 w-5 text-primary" />
            {nameToShow}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm whitespace-pre-wrap">{messageToShow}</p>
        </CardContent>
      </Card>
    </div>
  );
});

// Asignar un displayName para facilitar la depuración
AgentWelcomeCard.displayName = "AgentWelcomeCard";

export { AgentWelcomeCard };
