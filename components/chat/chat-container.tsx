"use client";

import { MessageInput } from "@/components/chat/message-input";
import { Message } from "@/types/chat";
import { Bot, User, ArrowDown } from "lucide-react";
import {
  sendMessage,
  updateMessages,
  createNewSessionId,
  getCurrentUser,
} from "@/app/actions/chat";
import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generateUUID } from "@/utils/uuid";
import { cn } from "@/lib/utils";
import { AgentWelcomeCard } from "@/components/chat/agent-welcome-card";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

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

  const isSessionMode = !!propSessionId;

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

  const handleSubmit = async (formData: FormData) => {
    const messageText = formData.get("message");
    if (!messageText || typeof messageText !== "string" || !messageText.trim())
      return;

    setChatState("sending");
    vibrate([40, 20, 40]);
    setErrorMessage(null);

    const sessionId = isSessionMode
      ? propSessionId!
      : await createNewSessionId();

    const newMessage: Message = {
      id: generateUUID(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      session_id: sessionId,
      input: messageText,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // Desplazamiento al enviar un mensaje (mantener este scroll)
    scrollToBottom();
    // Segundo intento después de un breve retraso
    setTimeout(scrollToBottom, 50);

    setIsTyping(true);

    const urlParams = getUrlParams();

    if (!isSessionMode && isAuthenticated) {
      router.prefetch(`/chat/${sessionId}`);
    }

    try {
      const response = await sendMessage(
        sessionId,
        messageText,
        undefined,
        urlParams
      );

      if (response.success) {
        vibrate([50, 30, 100]);

        const botMessage: Message = {
          id: generateUUID(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          session_id: sessionId,
          input: "",
        };

        setIsTyping(false);
        setChatState("idle");

        const messagesWithBot = [...updatedMessages, botMessage];
        setMessages(messagesWithBot);

        // Desplazamiento al recibir respuesta (mantener este scroll)
        scrollToBottom();
        // Segundo intento después de un breve retraso
        setTimeout(scrollToBottom, 100);

        await updateMessages(messagesWithBot);

        if (!isSessionMode && isAuthenticated) {
          router.replace(`/chat/${sessionId}`, { scroll: false });
        }
      } else {
        vibrate([100, 50, 100, 50, 100]);
        setIsTyping(false);
        setChatState("error");
        setErrorMessage(response.message || t("error"));
      }
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      vibrate([100, 50, 100, 50, 100]);
      setIsTyping(false);
      setChatState("error");
      setErrorMessage(t("errorMessage"));
    }
  };

  const getStateText = () => {
    switch (chatState) {
      case "sending":
        return t("sending");
      case "error":
        return errorMessage || t("error");
      default:
        return "";
    }
  };

  const handleQuotationRequest = async () => {
    const formData = new FormData();
    formData.append(
      "message",
      t("quotationMessage") || "Quiero una cotización"
    );
    await handleSubmit(formData);
  };

  const hasUserMessages = messages.some((message) => message.isUser);

  const memoizedAgentId = useMemo(() => effectiveAgentId, [effectiveAgentId]);

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden bg-gradient-to-b from-background to-background/80 relative"
      )}
    >
      <div
        className="flex-1 max-h-[calc(100vh-5rem)] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent pb-24 scroll-smooth"
        ref={scrollRef}
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="container mx-auto max-w-3xl">
          <AgentWelcomeCard agentId={memoizedAgentId} />
        </div>

        <div className="container max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 mb-6 message",
                message.isUser ? "justify-end" : "justify-start",
                index === messages.length - 1 ? "animate-fadeIn" : ""
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full shrink-0 shadow-sm",
                  message.isUser
                    ? "order-last bg-primary/90"
                    : "bg-muted-foreground/20"
                )}
              >
                {message.isUser ? (
                  <User className="w-3.5 h-3.5 text-primary-foreground" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1 max-w-[85%]">
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                    message.isUser
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
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
                <div className="text-[10px] opacity-60 px-2">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-3 mb-6 mr-auto animate-fadeIn">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted-foreground/20 shrink-0 shadow-sm">
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="px-4 py-3 bg-muted rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex items-center space-x-1.5">
                  <div
                    className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "200ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "400ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante para desplazarse al final */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-4 z-10 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 animate-fadeIn"
          aria-label="Desplazarse al final"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}

      {chatState === "error" && (
        <div className="px-4 py-1.5 text-xs text-center text-destructive bg-destructive/10">
          {getStateText()}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0  bg-gradient-to-t from-background via-background/95 to-transparent pt-6">
        <div className="container px-2 mx-auto max-w-3xl pb-4">
          {!hasUserMessages && !isSessionMode ? (
            <div className="flex flex-col items-center px-4 mb-2 text-center">
              <Button
                onClick={() => {
                  vibrate([40, 20, 40]);
                  handleQuotationRequest();
                }}
                className="group relative overflow-hidden dark:bg-zinc-800/40 bg-zinc-50 dark:hover:bg-zinc-800/60 hover:bg-zinc-100/80 
                px-12 py-6 rounded-lg backdrop-blur-xl
                shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_8px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_8px_20px_-4px_rgba(0,0,0,0.2)]
                hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset,0_12px_24px_-4px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_12px_24px_-4px_rgba(0,0,0,0.3)]
                active:scale-[0.98] transition-all duration-300"
              >
                <div className="relative flex items-center gap-3">
                  <span className="relative z-10 text-[17px] font-medium tracking-[-0.01em] text-zinc-800 dark:text-zinc-200">
                    {t("startQuotation") || "Iniciar cotización"}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-[4px] h-[4px] rounded-full bg-[#07c167] shadow-[0_0_6px_rgba(7,193,103,0.4)] animate-pulse" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
            </div>
          ) : (
            <MessageInput
              onSubmit={async (formData) => {
                vibrate([40, 20, 40]);
                return handleSubmit(formData);
              }}
              disabled={chatState === "error"}
              className="pt-2"
            />
          )}
        </div>
      </div>
    </div>
  );
}
