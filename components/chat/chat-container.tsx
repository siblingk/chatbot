"use client";

import { MessageInput } from "@/components/chat/message-input";
import { Message } from "@/types/chat";
import { Bot, User } from "lucide-react";
import {
  sendMessage,
  updateMessages,
  createNewSessionId,
  getCurrentUser,
} from "@/app/actions/chat";
import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useTransition,
} from "react";
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
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  // Referencia para evitar re-renderizados innecesarios
  const messagesRef = useRef<Message[]>([]);

  // Determinar si estamos en modo sesión o en modo chat normal
  const isSessionMode = !!propSessionId;

  // Verificar si el usuario está autenticado
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

  // Función para obtener el agentId de la sesión
  const getSessionAgentId = async () => {
    if (propAgentId) {
      setEffectiveAgentId(propAgentId);
      return;
    }

    if (!propSessionId) return;

    console.log("=== INICIO getSessionAgentId ===");
    console.log("SessionId:", propSessionId);

    // Si tenemos mensajes, buscar el agentId en ellos
    if (initialMessages && initialMessages.length > 0) {
      console.log("Buscando agentId en los mensajes iniciales...");

      // Ordenar mensajes por fecha (más recientes primero)
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

      // Buscar el primer mensaje que tenga metadata con agentId
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

    // Si no encontramos el agentId en los mensajes, intentar obtenerlo de la API
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

  // Convertir los mensajes del historial al formato que usa el chat
  useEffect(() => {
    let formattedMessages: Message[] = [];

    if (isSessionMode && initialMessages.length > 0) {
      // Convertir mensajes de ChatMessage a Message
      formattedMessages = (initialMessages as ChatMessage[]).flatMap((msg) => {
        const clientMessages: Message[] = [];

        // Si hay input, agregar mensaje del usuario
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

        // Si hay output, agregar mensaje del asistente
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
      // En modo chat normal, los mensajes ya están en el formato correcto
      formattedMessages = initialMessages as Message[];
    }

    setMessages(formattedMessages);
  }, [initialMessages, propSessionId, isSessionMode]);

  // Obtener agentId cuando se carga el componente
  useEffect(() => {
    getSessionAgentId();
  }, [propSessionId, propAgentId]);

  // Función para desplazarse al final del chat
  const scrollToBottom = () => {
    if (scrollRef.current) {
      try {
        // Método 1: Establecer scrollTop directamente
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;

        // Método 2: Usar scrollTo con behavior: "instant"
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "instant" as ScrollBehavior,
        });

        // Método 3: Usar un enfoque alternativo con scrollIntoView
        const lastChild = scrollRef.current.lastElementChild;
        if (lastChild) {
          lastChild.scrollIntoView({ behavior: "auto", block: "end" });
        }

        // Forzar un reflow para asegurar que el scroll se aplique correctamente
        void scrollRef.current.offsetHeight;
      } catch (error) {
        console.error("Error al hacer scroll:", error);
        // Fallback simple si algo falla
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    }
  };

  // Desplazarse al final cuando cambian los mensajes o el estado de carga
  // Usar useLayoutEffect para que el scroll ocurra antes de la pintura del navegador
  useLayoutEffect(() => {
    scrollToBottom();
    // Programar múltiples intentos de scroll para asegurar que funcione
    const scrollTimers = [
      setTimeout(scrollToBottom, 0),
      setTimeout(scrollToBottom, 50),
      setTimeout(scrollToBottom, 100),
      setTimeout(scrollToBottom, 200),
    ];
    // Actualizar la referencia para evitar re-renderizados
    messagesRef.current = messages;

    // Limpiar los timers cuando se desmonte el componente
    return () => {
      scrollTimers.forEach(clearTimeout);
    };
  }, [messages]);

  // Efecto separado para isTyping para evitar re-renderizados innecesarios
  useLayoutEffect(() => {
    if (isTyping) {
      scrollToBottom();
      // Programar múltiples intentos de scroll para asegurar que funcione
      const scrollTimers = [
        setTimeout(scrollToBottom, 0),
        setTimeout(scrollToBottom, 50),
        setTimeout(scrollToBottom, 100),
        setTimeout(scrollToBottom, 200),
      ];

      // Limpiar los timers cuando se desmonte el componente
      return () => {
        scrollTimers.forEach(clearTimeout);
      };
    }
  }, [isTyping]);

  // Observador de mutaciones para detectar cambios en el contenido del chat
  useEffect(() => {
    if (!scrollRef.current) return;

    // Crear un observador de mutaciones para detectar cambios en el DOM
    const observer = new MutationObserver((mutations) => {
      // Verificar si las mutaciones afectan al contenido del chat
      const shouldScroll = mutations.some((mutation) => {
        // Si se añaden nodos, probablemente sea un nuevo mensaje
        if (mutation.addedNodes.length > 0) return true;

        // Si cambia el contenido de texto, probablemente sea un mensaje que se está escribiendo
        if (mutation.type === "characterData") return true;

        // Si cambian los atributos de un elemento, podría ser un cambio de estilo o clase
        if (
          mutation.type === "attributes" &&
          (mutation.target as Element).classList.contains("message")
        )
          return true;

        return false;
      });

      // Solo hacer scroll si las mutaciones son relevantes
      if (shouldScroll) {
        scrollToBottom();
        // Intentar nuevamente después de un breve retraso para asegurar que el contenido se haya renderizado completamente
        setTimeout(scrollToBottom, 50);
      }
    });

    // Configurar el observador para observar cambios en los hijos y el contenido
    observer.observe(scrollRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    // Limpiar el observador cuando se desmonta el componente
    return () => observer.disconnect();
  }, []);

  // Asegurarse de que el scroll funcione cuando la ventana cambia de tamaño
  useEffect(() => {
    const handleResize = () => {
      scrollToBottom();
      // Intentar nuevamente después de un breve retraso para asegurar que el contenido se haya reajustado
      setTimeout(scrollToBottom, 100);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Función para hacer vibrar el dispositivo con un patrón más agradable
  const vibrate = (pattern: number[] = [50, 30, 80]) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Función para obtener los parámetros de la URL
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

    // Cambiar el estado a "sending" y vibrar con un patrón suave
    setChatState("sending");
    vibrate([40, 20, 40]);
    setErrorMessage(null);

    // Determinar el sessionId a usar
    const sessionId = isSessionMode
      ? propSessionId!
      : await createNewSessionId();

    // Crear el mensaje del usuario
    const newMessage: Message = {
      id: generateUUID(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      session_id: sessionId,
      input: messageText,
    };

    // Actualizar el estado local inmediatamente para mostrar el mensaje del usuario
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // Desplazarse al fondo inmediatamente después de mostrar el mensaje del usuario
    scrollToBottom();
    setTimeout(scrollToBottom, 0);
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 100);
    setTimeout(scrollToBottom, 200);

    // Mostrar el indicador de carga
    setIsTyping(true);

    // Obtener los parámetros de la URL
    const urlParams = getUrlParams();

    // Enviar el mensaje al servidor
    try {
      // Enviar el mensaje al servidor con los parámetros de la URL
      const response = await sendMessage(
        sessionId,
        messageText,
        undefined,
        urlParams
      );

      if (response.success) {
        // Vibrar con un patrón más pronunciado al recibir respuesta
        vibrate([50, 30, 100]);

        // Crear el mensaje del bot
        const botMessage: Message = {
          id: generateUUID(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          session_id: sessionId,
          input: "",
        };

        // Ocultar el indicador de carga, mostrar el mensaje del bot y volver al estado "idle"
        setIsTyping(false);
        setChatState("idle");

        // Actualizar el estado de los mensajes con el mensaje del bot
        const messagesWithBot = [...updatedMessages, botMessage];
        setMessages(messagesWithBot);

        // Desplazarse al fondo después de mostrar el mensaje del bot
        scrollToBottom();
        setTimeout(scrollToBottom, 0);
        setTimeout(scrollToBottom, 50);
        setTimeout(scrollToBottom, 100);
        setTimeout(scrollToBottom, 200);
        setTimeout(scrollToBottom, 300);
        setTimeout(scrollToBottom, 500);

        // Actualizar la base de datos con todos los mensajes
        await updateMessages(messagesWithBot);

        // Si no estamos en modo sesión y el usuario está autenticado, redirigir a la página de chat con sessionId
        if (!isSessionMode && isAuthenticated) {
          // Usar startTransition para una transición más fluida
          startTransition(() => {
            router.push(`/chat/${sessionId}`);
          });
        }
      } else {
        // Si hay un error en la respuesta, vibrar con un patrón de error
        vibrate([100, 50, 100, 50, 100]);
        setIsTyping(false);
        setChatState("error");
        setErrorMessage(response.message || t("error"));
      }
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      // Vibrar con un patrón de error
      vibrate([100, 50, 100, 50, 100]);
      setIsTyping(false);
      setChatState("error");
      setErrorMessage(t("errorMessage"));
    }
  };

  // Función para obtener el texto del estado actual
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

  // Memoizar el agentId para evitar re-renderizados innecesarios
  const memoizedAgentId = useMemo(() => effectiveAgentId, [effectiveAgentId]);

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden bg-gradient-to-b from-background to-background/80 relative",
        isPending && "opacity-80 transition-opacity duration-300"
      )}
    >
      {isPending && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}

      <div
        className="flex-1 max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-3rem)] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent pb-24"
        ref={scrollRef}
      >
        {/* Tarjeta de bienvenida del agente - siempre visible en la parte superior */}
        <div className="container mx-auto max-w-3xl">
          <AgentWelcomeCard agentId={memoizedAgentId} />
        </div>

        <div className="container max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 mb-6 message",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full shrink-0",
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
                    "px-4 py-2.5 rounded-2xl text-sm",
                    message.isUser
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  )}
                >
                  {message.isUser ? (
                    message.text
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

          {/* Indicador de escritura */}
          {isTyping && (
            <div className="flex items-start gap-3 mb-6 mr-auto">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted-foreground/20 shrink-0">
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="px-4 py-3 bg-muted rounded-2xl rounded-tl-none">
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

      {/* Estado del chat - solo mostrar errores sin animaciones */}
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
