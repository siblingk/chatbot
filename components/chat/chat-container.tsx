"use client";

import { MessageInput } from "./message-input";
import { Message } from "@/types/chat";
import { Bot, User } from "lucide-react";

import {
  sendMessage,
  updateMessages,
  createNewSessionId,
} from "@/app/actions/chat";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/chat-context";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { generateUUID } from "@/utils/uuid";

interface ChatContainerProps {
  // Mantenemos la prop por compatibilidad, aunque no la usemos directamente
  workshopId?: string;
}

export default function ChatContainer({}: ChatContainerProps) {
  const t = useTranslations("chat");
  const { messages, setMessages } = useChat();
  const [isTyping, setIsTyping] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

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

        // Redirigir a la página de chat con el ID de sesión después del primer mensaje
        router.push(`/chat/${sessionId}`);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuotationRequest = async () => {
    const formData = new FormData();
    formData.append("message", t("quotationMessage"));
    await handleSubmit(formData);
  };

  const hasUserMessages = messages.some((message) => message.isUser);
  console.log(isTyping);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="flex-1 max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-10rem)] overflow-y-auto p-4"
        ref={scrollRef}
      >
        <div className="container max-w-3xl mx-auto space-y-4 pb-20">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isUser ? "justify-end" : "justify-start"
              } items-end gap-2`}
            >
              {!message.isUser && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              </div>
              {message.isUser && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted">
                <div className="flex space-x-2">
                  <div
                    className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 shadow-xl">
        {!hasUserMessages ? (
          <div className="flex flex-col items-center px-4 mb-6 text-center">
            <span className="mb-3 text-sm text-muted-foreground animate-bounce">
              {t("discoverQuotation")}
            </span>
            <Button
              onClick={handleQuotationRequest}
              className="group relative overflow-hidden dark:bg-zinc-800/40 bg-zinc-50 dark:hover:bg-zinc-800/60 hover:bg-zinc-100/80 
            px-12 py-6 rounded-3xl backdrop-blur-xl
            shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_8px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_8px_20px_-4px_rgba(0,0,0,0.2)]
            hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset,0_12px_24px_-4px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_12px_24px_-4px_rgba(0,0,0,0.3)]
            active:scale-[0.98] transition-all duration-300"
            >
              <div className="relative flex items-center gap-3">
                <span className="relative z-10 text-[17px] font-medium tracking-[-0.01em] text-zinc-800 dark:text-zinc-200">
                  {t("startQuotation")}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-[4px] h-[4px] rounded-full bg-[#07c167] shadow-[0_0_6px_rgba(7,193,103,0.4)] animate-pulse" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </div>
        ) : (
          <MessageInput onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
