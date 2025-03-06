"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getUserPreferredAgent } from "@/app/actions/agents";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useUserRole } from "@/hooks/useUserRole";

interface AgentWelcomeCardProps {
  agentId?: string;
}

export function AgentWelcomeCard({ agentId }: AgentWelcomeCardProps) {
  const t = useTranslations("chat");
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const urlAgentId = searchParams.get("agentId") || undefined;
  const { isShop } = useUserRole();

  useEffect(() => {
    async function fetchAgentInfo() {
      try {
        // Priorizar el agentId pasado como prop, luego el de la URL
        const effectiveAgentId = agentId || urlAgentId;

        console.log("=== INICIO AgentWelcomeCard ===");
        console.log("AgentId proporcionado como prop:", agentId);
        console.log("AgentId de la URL:", urlAgentId);
        console.log("AgentId efectivo a usar:", effectiveAgentId);
        console.log("Usuario es tienda:", isShop);

        // Siempre usar getUserPreferredAgent para obtener el agente correcto según el rol
        // Si hay un effectiveAgentId, se pasará como parámetro para que se use como prioridad
        console.log(
          "Obteniendo agente preferido con ID:",
          effectiveAgentId || "ninguno"
        );
        const preferredAgent = await getUserPreferredAgent(effectiveAgentId);

        if (preferredAgent) {
          console.log("Agente encontrado:", preferredAgent.name);
          console.log("ID del agente:", preferredAgent.id);
          console.log("Rol objetivo del agente:", preferredAgent.target_role);
          console.log("Mensaje de bienvenida:", preferredAgent.welcome_message);

          // Verificar si el agente es compatible con el rol del usuario
          const isCompatible =
            preferredAgent.target_role === "both" ||
            (isShop && preferredAgent.target_role === "shop") ||
            (!isShop && preferredAgent.target_role === "user");

          console.log(
            "Agente compatible con el rol del usuario:",
            isCompatible
          );

          if (preferredAgent.welcome_message) {
            setWelcomeMessage(preferredAgent.welcome_message);
            setAgentName(preferredAgent.name);
          } else {
            console.log(
              "El agente no tiene mensaje de bienvenida, usando predeterminado"
            );
            setWelcomeMessage(t("initialMessage"));
            setAgentName(preferredAgent.name);
          }
        } else {
          console.log(
            "No se encontró ningún agente, usando mensaje predeterminado"
          );
          setWelcomeMessage(t("initialMessage"));
        }
      } catch (error) {
        console.error("Error al obtener información del agente:", error);
        setWelcomeMessage(t("initialMessage"));
      }
    }

    setWelcomeMessage(null);
    setAgentName(null);

    fetchAgentInfo();
  }, [agentId, urlAgentId, t, isShop]);

  // Siempre mostrar la tarjeta, incluso si no hay mensaje de bienvenida específico
  const messageToShow = welcomeMessage || t("initialMessage");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="mb-6 bg-background border-none shadow-none">
        <CardHeader className="py-4">
          <CardTitle className="text-md flex items-center gap-2 text-primary">
            <Bot className="h-5 w-5 text-primary" />
            {agentName ? `${agentName}` : "Welcome to siblingk"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm whitespace-pre-wrap">{messageToShow}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
