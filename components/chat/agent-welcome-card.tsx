"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Sparkles } from "lucide-react";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSearchParams } from "next/navigation";
import { getUserPreferredAgent } from "@/app/actions/agents";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "../ui/markdown-renderer";

interface AgentWelcomeCardProps {
  agentId?: string;
}

// Altura fija para evitar layout shifts
const CARD_MIN_HEIGHT = "140px";

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

  // Memoizar el ID efectivo del agente para evitar cálculos innecesarios
  const effectiveAgentId = useMemo(
    () => agentId || urlAgentId,
    [agentId, urlAgentId]
  );

  // Función para obtener la información del agente
  const fetchAgentInfo = useCallback(async () => {
    try {
      setIsLoading(true);

      // Obtener el agente preferido - esta función ahora usa caché
      const preferredAgent = await getUserPreferredAgent(effectiveAgentId);

      if (preferredAgent) {
        console.log("Agente encontrado:", preferredAgent.name);
        console.log("Mensaje de bienvenida:", preferredAgent.welcome_message);

        // El agente es compatible por defecto ya que getUserPreferredAgent ya hace esta verificación
        setAgentName(preferredAgent.name);

        // Si el agente tiene un mensaje de bienvenida, usarlo
        if (preferredAgent.welcome_message) {
          setWelcomeMessage(preferredAgent.welcome_message);
        } else {
          // Si no tiene mensaje de bienvenida, usar el mensaje predeterminado
          setWelcomeMessage(t("initialMessage"));
        }
      } else {
        // Si no se encontró ningún agente, usar valores predeterminados
        setAgentName("Welcome to siblingk");
        setWelcomeMessage(t("initialMessage"));
      }
    } catch (error) {
      // Capturar cualquier error y usar el mensaje predeterminado
      console.error("Error al obtener información del agente:", error);
      setAgentName("Welcome to siblingk");
      setWelcomeMessage(t("initialMessage"));
    } finally {
      setIsLoading(false);
    }
  }, [effectiveAgentId, t]);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="transition-all duration-300"
      style={{ minHeight: CARD_MIN_HEIGHT, opacity: isLoading ? 0.7 : 1 }}
    >
      <Card className="mb-6 text-justify p-0 border border-border/10 shadow-sm rounded-xl font-normal tracking-wide overflow-hidden h-full relative">
        <CardHeader className="py-4 relative bg-muted/10">
          <CardTitle className="text-lg flex items-center justify-center gap-3 mb-0 w-fit px-4 py-2 mx-auto rounded-full text-primary">
            <motion.div
              animate={{
                rotate: [0, 5, 0, -5, 0],
                scale: [1, 1.05, 1, 1.05, 1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="relative"
            >
              <Bot className="h-5 w-5 text-primary relative z-10" />
              <motion.div
                className="absolute -inset-1 rounded-full bg-primary/10"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <span className="font-medium">{nameToShow}</span>
            <Sparkles className="h-4 w-4 text-primary/70" />
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 pb-6 px-6 text-sm relative bg-background">
          <MarkdownRenderer content={messageToShow} />
        </CardContent>
      </Card>
    </motion.div>
  );
});

// Asignar un displayName para facilitar la depuración
AgentWelcomeCard.displayName = "AgentWelcomeCard";

export { AgentWelcomeCard };
