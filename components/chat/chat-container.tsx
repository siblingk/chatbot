"use client";

import { MessageInput } from "./message-input";
import { Message } from "@/types/chat";
import { Bot, User } from "lucide-react";

import {
  sendMessage,
  updateMessages,
  createNewSessionId,
  getCurrentUser,
} from "@/app/actions/chat";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/chat-context";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { generateUUID } from "@/utils/uuid";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AgentWelcomeCard } from "@/components/chat/agent-welcome-card";

interface ChatContainerProps {
  // Mantenemos la prop por compatibilidad, aunque no la usemos directamente
  workshopId?: string;
}

export default function ChatContainer({}: ChatContainerProps) {
  const t = useTranslations("chat");
  const { messages, setMessages } = useChat();
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showWelcomeCard, setShowWelcomeCard] = useState(true);

  // Verificar si se redirigió desde una sesión de chat que no existe
  const noChat = searchParams.get("noChat") === "true";

  // Extraer el agentId directamente de los parámetros de URL
  const agentId = searchParams.get("agentId");

  console.log("ChatContainer - agentId obtenido de URL:", agentId);

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

  // Extraer todos los parámetros de URL
  const urlParams: Record<string, unknown> = {};

  // Procesar todos los parámetros de la URL
  searchParams.forEach((value, key) => {
    // Si el parámetro es agentConfig, parsearlo como JSON
    if (key === "agentConfig") {
      try {
        urlParams[key] = JSON.parse(value);
      } catch {
        console.error("Error al parsear agentConfig");
        urlParams[key] = value;
      }
    }
    // Convertir "true"/"false" a booleanos
    else if (value === "true" || value === "false") {
      urlParams[key] = value === "true";
    }
    // Intentar parsear JSON si el valor parece ser un objeto o array
    else if (
      (value.startsWith("{") && value.endsWith("}")) ||
      (value.startsWith("[") && value.endsWith("]"))
    ) {
      try {
        urlParams[key] = JSON.parse(value);
      } catch {
        // Si falla el parseo, usar el valor como string
        urlParams[key] = value;
      }
    }
    // Usar el valor como string para el resto de casos
    else {
      urlParams[key] = value;
    }
  });

  // Efecto para controlar la visibilidad de la tarjeta de bienvenida
  useEffect(() => {
    console.log("ChatContainer - agentId para tarjeta de bienvenida:", agentId);
    // Siempre mostrar la tarjeta de bienvenida
    setShowWelcomeCard(true);
  }, [agentId]);

  // Función para desplazarse al final del chat
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Desplazarse al final cuando cambian los mensajes o el estado de carga
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (formData: FormData) => {
    const messageText = formData.get("message");
    if (!messageText || typeof messageText !== "string" || !messageText.trim())
      return;

    // Siempre crear un nuevo session_id para un nuevo chat
    const sessionId = await createNewSessionId();

    const newMessage: Message = {
      id: generateUUID(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      session_id: sessionId,
      input: messageText,
    };

    const updatedMessages = [...messages, newMessage];
    await updateMessages(updatedMessages);
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      // Pasar todos los parámetros de URL al enviar el mensaje
      const response = await sendMessage(
        sessionId,
        messageText,
        undefined,
        Object.keys(urlParams).length > 0 ? urlParams : undefined
      );

      if (response.success) {
        const botMessage: Message = {
          id: generateUUID(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          session_id: sessionId,
          input: "",
        };

        const messagesWithBot = [...updatedMessages, botMessage];
        await updateMessages(messagesWithBot);
        setMessages(messagesWithBot);

        // Solo redirigir a la página de chat si el usuario está autenticado
        if (isAuthenticated) {
          router.push(`/chat/${sessionId}`);
        }
      }
    } finally {
      setIsTyping(false);
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

  // Función para vibrar el dispositivo
  const vibrate = (pattern: number[] = [50, 30, 80]) => {
    if (
      typeof window !== "undefined" &&
      window.navigator &&
      window.navigator.vibrate
    ) {
      window.navigator.vibrate(pattern);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-background to-background/80 relative">
      {noChat && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-3 text-center text-sm">
          {t("chatNotFound", {
            defaultValue: "The chat session was not found or has been deleted.",
          })}
        </div>
      )}

      <div
        className="flex-1 max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-3rem)] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent pb-32"
        ref={scrollRef}
      >
        {/* Tarjeta de bienvenida del agente - siempre visible en la parte superior */}
        {showWelcomeCard && (
          <div className="z-10 px-4 pt-4 pb-2 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto max-w-3xl">
              <AgentWelcomeCard agentId={agentId || undefined} />
            </div>
          </div>
        )}
        <div className="container max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                }}
                className={cn(
                  "flex items-start gap-3 mb-6",
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
                    {message.text}
                  </div>
                  <div className="text-[10px] opacity-60 px-2">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 mb-6 mr-auto"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted-foreground/20 shrink-0">
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="px-4 py-3 bg-muted rounded-2xl rounded-tl-none">
                <div className="flex items-center space-x-1.5">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div className="container mx-auto max-w-3xl">
          {!hasUserMessages ? (
            <div className="flex flex-col items-center px-4 mb-6 text-center">
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
              className="bg-gradient-to-t from-background to-transparent"
            />
          )}
        </div>
      </div>
    </div>
  );
}
