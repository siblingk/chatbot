"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import { MessageInput } from "@/components/chat/message-input";
import { sendMessage, updateMessages } from "@/app/actions/chat";
import { generateUUID } from "@/utils/uuid";
import { Message } from "@/types/chat";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

import { useTranslations } from "next-intl";
import { AgentWelcomeCard } from "@/components/chat/agent-welcome-card";
import { useSearchParams } from "next/navigation";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

// Interfaz para los mensajes que vienen de la base de datos
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

interface ChatSessionContainerProps {
  sessionId: string;
  initialMessages: ChatMessage[];
}

// Estados posibles del chat
type ChatState = "idle" | "sending" | "error";

export default function ChatSessionContainer({
  sessionId,
  initialMessages,
}: ChatSessionContainerProps) {
  const t = useTranslations("chat");
  const searchParams = useSearchParams();
  const urlAgentId = searchParams.get("agentId");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [effectiveAgentId, setEffectiveAgentId] = useState<string | undefined>(
    urlAgentId || undefined
  );
  // Referencia para evitar re-renderizados innecesarios
  const messagesRef = useRef<Message[]>([]);

  // Convertir los mensajes del historial al formato que usa el chat
  useEffect(() => {
    const formattedMessages = initialMessages.flatMap((msg) => {
      const clientMessages: Message[] = [];

      // Si hay input, agregar mensaje del usuario
      if (msg.input) {
        clientMessages.push({
          id: `${msg.id}-input`,
          text: msg.input,
          isUser: true,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          session_id: sessionId,
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
          session_id: sessionId,
          input: "",
        });
      }

      return clientMessages;
    });

    // Si no hay mensajes formateados y tampoco hay mensajes en el estado actual,
    // podemos agregar un mensaje de bienvenida
    if (formattedMessages.length === 0 && messages.length === 0) {
      // No agregamos automáticamente un mensaje de bienvenida, dejamos que el usuario inicie la conversación
      // El componente mostrará la interfaz vacía lista para que el usuario escriba
    }

    setMessages(formattedMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages, sessionId]);

  // Función para obtener el agentId de la sesión
  const getSessionAgentId = useCallback(async () => {
    console.log("=== INICIO getSessionAgentId ===");
    console.log("SessionId:", sessionId);
    console.log("UrlAgentId:", urlAgentId);

    // Si ya tenemos un agentId en la URL, usarlo directamente
    if (urlAgentId) {
      console.log("Usando agentId de la URL:", urlAgentId);
      setEffectiveAgentId(urlAgentId);
      console.log("=== FIN getSessionAgentId ===");
      return;
    }

    // Si tenemos mensajes, buscar el agentId en ellos
    if (initialMessages && initialMessages.length > 0) {
      console.log("Buscando agentId en los mensajes iniciales...");

      // Ordenar mensajes por fecha (más recientes primero)
      const sortedMessages = [...initialMessages].sort((a, b) => {
        const dateA = a.created_at
          ? new Date(a.created_at).getTime()
          : a.timestamp
          ? new Date(a.timestamp).getTime()
          : 0;
        const dateB = b.created_at
          ? new Date(b.created_at).getTime()
          : b.timestamp
          ? new Date(b.timestamp).getTime()
          : 0;
        return dateB - dateA;
      });

      // Buscar el primer mensaje que tenga metadata con agentId
      for (const message of sortedMessages) {
        if (message.metadata && message.metadata.agentId) {
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
        `/api/chat/session-agent?sessionId=${sessionId}`
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
  }, [sessionId, urlAgentId, initialMessages]);

  // Obtener agentId cuando se carga el componente
  useEffect(() => {
    if (!urlAgentId) {
      getSessionAgentId();
    }
  }, [urlAgentId, getSessionAgentId]);

  // Mostrar logs para depuración
  useEffect(() => {
    console.log("Estado actual del chat:");
    console.log("- sessionId:", sessionId);
    console.log("- urlAgentId:", urlAgentId);
    console.log("- effectiveAgentId:", effectiveAgentId);
    console.log("- initialMessages:", initialMessages.length);
  }, [sessionId, urlAgentId, effectiveAgentId, initialMessages]);

  // Función para desplazarse al final del chat
  const scrollToBottom = () => {
    if (scrollRef.current) {
      // Usar scrollIntoView con behavior: "auto" para un desplazamiento inmediato
      // y block: "end" para asegurar que el final sea visible
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;

      // Usar un enfoque alternativo para asegurar que el scroll funcione en todos los navegadores
      const lastChild = scrollRef.current.lastElementChild;
      if (lastChild) {
        lastChild.scrollIntoView({ behavior: "auto", block: "end" });
      }
    }
  };

  // Desplazarse al final cuando cambian los mensajes o el estado de carga
  // Usar useLayoutEffect para que el scroll ocurra antes de la pintura del navegador
  useLayoutEffect(() => {
    scrollToBottom();
    // Actualizar la referencia para evitar re-renderizados
    messagesRef.current = messages;
  }, [messages]);

  // Efecto separado para isTyping para evitar re-renderizados innecesarios
  useLayoutEffect(() => {
    if (isTyping) {
      scrollToBottom();
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
    const handleResize = () => scrollToBottom();
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
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // Desplazarse al fondo inmediatamente después de mostrar el mensaje del usuario
    // Usar múltiples intentos de scroll para asegurar que funcione
    scrollToBottom();
    setTimeout(scrollToBottom, 0);
    setTimeout(scrollToBottom, 100);
    setTimeout(scrollToBottom, 300);

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
        setMessages((prevMessages) => [...prevMessages, botMessage]);

        // Desplazarse al fondo después de mostrar el mensaje del bot
        // Usar múltiples intentos de scroll para asegurar que funcione
        scrollToBottom();
        setTimeout(scrollToBottom, 0);
        setTimeout(scrollToBottom, 100);
        setTimeout(scrollToBottom, 300);
        setTimeout(scrollToBottom, 500);

        // Actualizar la base de datos con todos los mensajes
        // Usamos el estado actual para asegurarnos de tener todos los mensajes
        updateMessages([...messages, newMessage, botMessage]);
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

  // Efecto para controlar la visibilidad de la tarjeta de bienvenida
  useEffect(() => {
    console.log("ChatSessionContainer - sessionId:", sessionId);
  }, [sessionId]);

  // Memoizar el agentId para evitar re-renderizados innecesarios
  const memoizedAgentId = useMemo(() => effectiveAgentId, [effectiveAgentId]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div
        className="flex-1 overflow-y-auto p-4 pb-24 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent"
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

          {/* Indicador de escritura sin animaciones */}
          {isTyping && (
            <div className="flex items-start gap-3 max-w-[80%] mr-auto">
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

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-6">
        <div className="container px-2 mx-auto max-w-3xl pb-4">
          <MessageInput
            onSubmit={handleSubmit}
            disabled={chatState === "error"}
            className="pt-2"
          />
        </div>
      </div>
    </div>
  );
}
