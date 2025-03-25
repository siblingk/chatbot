"use client";
import { MessageInput } from "@/components/chat/message-input";
import { Message } from "@/types/chat";
import { Bot, User, ArrowDown, AlertCircle } from "lucide-react";
import {
  sendMessage,
  updateMessages,
  createNewSessionId,
  getCurrentUser,
} from "@/app/actions/chat";
import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { generateUUID } from "@/utils/uuid";
import { cn } from "@/lib/utils";

import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { AgentWelcomeCard } from "./agent-welcome-card";
import { ChatDashboardOptions } from "./chat-dashboard-options";
import { useUserRole } from "@/hooks/useUserRole";
import { AgentSelector } from "./agent-selector";
import { getAgents } from "@/app/actions/agents";

interface ChatMessage {
  id: string;
  content?: string;
  role?: string;
  created_at?: string;
  session_id?: string;
  input?: string;
  output?: string;
  timestamp?: string;
  user_id?: string;
  metadata?: {
    agentId?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
}

interface SharedChatContainerProps {
  sessionId?: string;
  initialMessages: Message[] | ChatMessage[];
  agentId?: string;
}

// Estados posibles del chat
type ChatState = "idle" | "sending" | "error";

export default function SharedChatContainer({
  sessionId: propSessionId,
  initialMessages = [],
  agentId: propAgentId,
}: SharedChatContainerProps) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [effectiveAgentId, setEffectiveAgentId] = useState<string | undefined>(
    propAgentId
  );
  // Estado para controlar la visibilidad del botón de scroll
  const [showScrollButton, setShowScrollButton] = useState(false);

  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const { role } = useUserRole();

  const isSessionMode = !!propSessionId;
  const isGeneralLead = role === "general_lead";
  const isAdminOrSuperAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    // Cargar los agentes al montar el componente
    async function loadAgents() {
      try {
        const isAdminOrSuperAdmin = role === "admin" || role === "super_admin";
        const onlyActive = !isAdminOrSuperAdmin;
        const filterByRole = !isAdminOrSuperAdmin;
        await getAgents(onlyActive, filterByRole);
      } catch (error) {
        console.error("Error al cargar agentes:", error);
      }
    }

    if (isAuthenticated) {
      loadAgents();
    }
  }, [isAuthenticated, role]);

  const getSessionAgentId = async () => {
    if (propAgentId) {
      setEffectiveAgentId(propAgentId);
      return;
    }

    if (!propSessionId) return;

    console.log("=== INICIO getSessionAgentId ===");
    console.log("SessionId:", propSessionId);

    if (initialMessages && initialMessages.length > 0) {
      console.log("Buscando agentId en los mensajes iniciales...");

      const sortedMessages = [...initialMessages].sort((a, b) => {
        const dateA =
          "created_at" in a
            ? new Date(a.created_at || "").getTime()
            : "timestamp" in a && a.timestamp
            ? new Date(a.timestamp).getTime()
            : 0;
        const dateB =
          "created_at" in b
            ? new Date(b.created_at || "").getTime()
            : "timestamp" in b && b.timestamp
            ? new Date(b.timestamp).getTime()
            : 0;
        return dateB - dateA;
      });

      for (const message of sortedMessages) {
        if (
          "metadata" in message &&
          message.metadata &&
          message.metadata.agentId
        ) {
          const foundAgentId = message.metadata.agentId as string;
          console.log("AgentId encontrado en mensaje:", foundAgentId);
          setEffectiveAgentId(foundAgentId);
          console.log("=== FIN getSessionAgentId ===");
          return;
        }
      }

      console.log("No se encontró agentId en los mensajes");
    }

    try {
      console.log("Consultando API para obtener el agentId de la sesión...");
      const response = await fetch(
        `/api/chat/session-agent?sessionId=${propSessionId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.agentId) {
          console.log("AgentId obtenido de la API:", data.agentId);
          setEffectiveAgentId(data.agentId);
          console.log("=== FIN getSessionAgentId ===");
          return;
        }
      }
    } catch (error) {
      console.error("Error al consultar la API:", error);
    }

    console.log(
      "No se pudo obtener el agentId, se usará el agente preferido del usuario"
    );
    console.log("=== FIN getSessionAgentId ===");
  };

  useEffect(() => {
    let formattedMessages: Message[] = [];

    if (isSessionMode && initialMessages.length > 0) {
      formattedMessages = (initialMessages as ChatMessage[]).flatMap((msg) => {
        const clientMessages: Message[] = [];

        if (msg.input) {
          clientMessages.push({
            id: `${msg.id}-input`,
            text: msg.input,
            isUser: true,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            session_id: propSessionId,
            input: msg.input,
          });
        }

        if (msg.output) {
          clientMessages.push({
            id: `${msg.id}-output`,
            text: msg.output,
            isUser: false,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            session_id: propSessionId,
            input: "",
          });
        }

        return clientMessages;
      });
    } else {
      formattedMessages = initialMessages as Message[];
    }

    setMessages(formattedMessages);
    messagesRef.current = formattedMessages;

    // Eliminar el desplazamiento automático al cargar mensajes iniciales
  }, [initialMessages, propSessionId, isSessionMode]);

  useEffect(() => {
    getSessionAgentId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propSessionId, propAgentId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      try {
        // Usar un enfoque más directo y forzado para el desplazamiento
        const scrollElement = scrollRef.current;

        // Método 1: Establecer scrollTop directamente
        scrollElement.scrollTop = scrollElement.scrollHeight;

        // Método 2: Usar setTimeout para asegurar que el DOM se ha actualizado
        setTimeout(() => {
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }, 10);

        // Método 3: Usar requestAnimationFrame para sincronizar con el ciclo de renderizado
        requestAnimationFrame(() => {
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        });

        // Forzar un reflow para asegurar que el scroll se aplique
        void scrollElement.offsetHeight;
      } catch (error) {
        console.error("Error al hacer scroll:", error);
        // Fallback simple si los métodos anteriores fallan
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    }
  };

  // Mantener la referencia de mensajes actualizada sin hacer scroll
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Añadir un efecto para desplazarse cuando cambia isTyping a false (mensaje recibido)
  useEffect(() => {
    // Solo hacer scroll cuando se recibe un mensaje (isTyping cambia de true a false)
    if (isTyping === false && messages.length > 0) {
      // Pequeño retraso para asegurar que el DOM se ha actualizado con el nuevo mensaje
      setTimeout(scrollToBottom, 50);
    }
  }, [isTyping, messages.length]);

  // Añadir un efecto para detectar cuando el usuario ha desplazado hacia arriba
  useEffect(() => {
    if (!scrollRef.current) return;

    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // Mostrar el botón cuando el usuario ha desplazado hacia arriba más de 200px desde el final
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
        setShowScrollButton(!isNearBottom);
      }
    };

    const scrollElement = scrollRef.current;
    scrollElement.addEventListener("scroll", handleScroll);

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const vibrate = (pattern: number[] = [50, 30, 80]) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const getUrlParams = () => {
    const params: Record<string, string> = {};
    if (effectiveAgentId) {
      params.agentId = effectiveAgentId;
    }
    return params;
  };

  // Función para enviar comandos desde botones
  const sendCommand = (buttonText: string) => {
    // Crear un mensaje de usuario con el texto del botón
    const userMessage: Message = {
      id: generateUUID(),
      text: buttonText,
      isUser: true,
      timestamp: new Date(),
      session_id: propSessionId || "",
      input: buttonText,
    };

    // Enviar el mensaje al webhook como si el usuario lo hubiera escrito
    const getCurrentSessionId = async () => {
      if (isSessionMode && propSessionId) {
        return propSessionId;
      } else {
        // Si no hay sessionId, crear uno nuevo
        return await createNewSessionId();
      }
    };

    // Añadir el mensaje a la conversación
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Desplazamiento al enviar el mensaje
    scrollToBottom();

    // Iniciar proceso de envío de mensaje
    setIsTyping(true);
    setChatState("sending");

    getCurrentSessionId().then((sessionId) => {
      // Enviar el mensaje al webhook
      sendMessage(sessionId, buttonText, undefined, getUrlParams())
        .then(({ success, message: responseMessage }) => {
          // Solo procedemos si la solicitud fue exitosa
          if (success) {
            // Crear un mensaje de bot con la respuesta
            const botMessage: Message = {
              id: generateUUID(),
              text: responseMessage,
              isUser: false,
              timestamp: new Date(),
              session_id: sessionId,
              output: responseMessage,
            };

            // Añadir la respuesta del bot a la conversación
            const updatedWithBotResponse = [...updatedMessages, botMessage];
            setMessages(updatedWithBotResponse);
            messagesRef.current = updatedWithBotResponse;

            // Si no estamos en modo sesión, almacenar los mensajes en localStorage
            if (!isSessionMode) {
              updateMessages(updatedWithBotResponse);
            }

            // Si es un nuevo chat, actualizar la URL
            if (!isSessionMode && !propSessionId) {
              router.push(`/chat/${sessionId}`);
            }

            // Desplazamiento al recibir respuesta
            scrollToBottom();
            setChatState("idle");
          } else {
            // Manejo de error
            setErrorMessage(responseMessage);
            setChatState("error");
            console.error("Error al enviar mensaje:", responseMessage);
          }
        })
        .catch((error) => {
          // Manejo de error de red u otros errores
          setErrorMessage(t("errorSending") || "Error al enviar mensaje");
          setChatState("error");
          console.error("Error al enviar mensaje:", error);
        })
        .finally(() => {
          setIsTyping(false);
        });
    });
  };

  // Función para manejar la entrada de texto
  const handleSubmit = async (formData: FormData) => {
    const messageText = formData.get("message");
    if (!messageText || typeof messageText !== "string" || !messageText.trim())
      return;

    setChatState("sending");
    vibrate([40, 20, 40]);
    setErrorMessage(null);

    // Reutilizar la función sendCommand
    sendCommand(messageText);
  };

  const hasUserMessages = messages.some((message) => message.isUser);

  const memoizedAgentId = useMemo(() => effectiveAgentId, [effectiveAgentId]);

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden bg-background",
        isSuperAdmin && "bg-background"
      )}
    >
      {/* Contenedor principal del chat - mejorado para visualización fija */}
      <div
        className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted/20 scrollbar-track-transparent pb-36 scroll-smooth",
          "relative h-[calc(100vh-10rem)]", // Altura fija calculada para evitar desbordamiento
          isSuperAdmin ? "bg-background pt-2 px-4" : "p-4"
        )}
        ref={scrollRef}
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Mostrar AgentWelcomeCard solo si no es super_admin o si no hay mensajes */}
        {(!isSuperAdmin || (isSuperAdmin && messages.length === 0)) && (
          <div className="container mx-auto max-w-3xl">
            <AgentWelcomeCard agentId={memoizedAgentId} />
          </div>
        )}

        {/* Contenedor de mensajes con límite de ancho máximo para mejor legibilidad */}
        <div className="container max-w-3xl mx-auto space-y-5">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 mb-4 message",
                message.isUser ? "justify-end" : "justify-start",
                index === messages.length - 1 ? "animate-fadeIn" : ""
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full shrink-0",
                  message.isUser
                    ? "order-last bg-primary/90"
                    : "bg-muted-foreground/10"
                )}
              >
                {message.isUser ? (
                  <User className="w-3 h-3 text-primary-foreground" />
                ) : (
                  <Bot className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1 max-w-[85%]">
                <div
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm",
                    message.isUser
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                      : "bg-muted rounded-tl-none shadow-sm"
                  )}
                >
                  {message.isUser ? (
                    <p className="whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                  ) : (
                    <MarkdownRenderer
                      content={message.text}
                      className={
                        message.isUser ? "text-primary-foreground" : ""
                      }
                    />
                  )}
                </div>
                <div className="text-[9px] opacity-60 px-2">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Indicador de escritura con mejor posicionamiento */}
          {isTyping && (
            <div className="flex items-start gap-3 message animate-fadeIn">
              <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 bg-muted-foreground/10">
                <Bot className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <div className="px-3 py-2 rounded-xl bg-muted rounded-tl-none shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {chatState === "error" && errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md px-3 py-2 mt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Botón de desplazamiento hacia abajo, mejorado visualmente */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-24 right-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-primary/90 text-primary-foreground shadow-md hover:bg-primary transition-colors"
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Área de control inferior mejorada con gradiente más sutil */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0",
          isSuperAdmin && "from-background pt-2"
        )}
      >
        <div
          className={cn(
            "container px-2 mx-auto max-w-4xl pb-4 py-3",
            isSuperAdmin && "max-w-4xl bg-background/90 backdrop-blur-sm"
          )}
        >
          {/* Panel de comandos siempre visible para super_admin */}
          {role === "super_admin" && (
            <div className="mb-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                {/* Dashboard options para super admin */}
                {isAuthenticated === true && (
                  <div className="w-full md:flex-1">
                    <AgentSelector
                      currentAgentId={effectiveAgentId}
                      onAgentChange={(agentId) => {
                        setEffectiveAgentId(agentId);
                        getSessionAgentId();
                      }}
                    />
                    <ChatDashboardOptions
                      onOptionSelected={(_, buttonText) => {
                        sendCommand(buttonText);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasUserMessages && role !== "super_admin" ? (
            <>
              {/* Si es admin normal (pero no super_admin), mostrar mensaje específico y selector de agentes */}
              {role === "admin" && (
                <div className="mb-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center mb-2 shadow-sm">
                    <h3 className="text-lg font-medium mb-2">
                      {t("adminDashboard") || "Panel de Administración"}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      {t("adminChatInfo") ||
                        "Este chat está conectado al webhook de administración para gestionar el sistema."}
                    </p>

                    {/* Selector de agentes para administradores */}
                    <AgentSelector
                      currentAgentId={effectiveAgentId}
                      onAgentChange={(agentId) => {
                        setEffectiveAgentId(agentId);
                        getSessionAgentId();
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Mostrar selector de agentes para todos los roles excepto admin, super_admin, general_lead y no autenticado */}
              {!isAdminOrSuperAdmin &&
                !isGeneralLead &&
                isAuthenticated === true && (
                  <div className="mb-3">
                    <AgentSelector
                      currentAgentId={effectiveAgentId}
                      onAgentChange={(agentId) => {
                        setEffectiveAgentId(agentId);
                        getSessionAgentId();
                      }}
                    />
                  </div>
                )}

              {/* Mostrar opciones del dashboard para roles que no sean super_admin, general_lead */}
              {isAuthenticated === true &&
                !isGeneralLead &&
                //@ts-expect-error asdasd
                role !== "super_admin" && (
                  <div className="px-1 py-2 bg-muted/10 rounded-lg shadow-sm border border-border/10 mb-3">
                    <ChatDashboardOptions
                      onOptionSelected={(_, buttonText) => {
                        sendCommand(buttonText);
                      }}
                    />
                  </div>
                )}
            </>
          ) : null}

          {/* Ocultar la entrada de texto para super_admin */}
          {role !== "super_admin" && (
            <MessageInput
              onSubmit={handleSubmit}
              disabled={chatState === "error" || isTyping}
              className="pt-2"
            />
          )}
        </div>
      </div>
    </div>
  );
}
