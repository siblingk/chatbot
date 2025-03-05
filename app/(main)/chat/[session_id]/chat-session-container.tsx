"use client";

import { useState, useEffect, useRef } from "react";
import { MessageInput } from "@/components/chat/message-input";
import { sendMessage, updateMessages } from "@/app/actions/chat";
import { generateUUID } from "@/utils/uuid";
import { Message } from "@/types/chat";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

// Interfaz para los mensajes que vienen de la base de datos
interface ChatMessage {
  id: string;
  session_id: string;
  input?: string;
  output?: string;
  timestamp: string; // Ahora es string porque lo serializamos
  user_id?: string;
}

interface ChatSessionContainerProps {
  sessionId: string;
  initialMessages: ChatMessage[];
}

// Estados posibles del chat
type ChatState = "idle" | "sending" | "processing" | "receiving" | "error";

export default function ChatSessionContainer({
  sessionId,
  initialMessages,
}: ChatSessionContainerProps) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          timestamp: new Date(msg.timestamp),
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
          timestamp: new Date(msg.timestamp),
          session_id: sessionId,
          input: "",
        });
      }

      return clientMessages;
    });

    setMessages(formattedMessages);
  }, [initialMessages, sessionId]);

  // Limpiar timeouts al desmontar el componente
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Función para desplazarse al final del chat
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Desplazarse al final cuando cambian los mensajes o el estado de carga
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, chatState]);

  // Función para hacer vibrar el dispositivo
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  // Función para obtener los parámetros de la URL
  const getUrlParams = () => {
    const params: Record<string, unknown> = {};

    // Solo extraer el agentId de los parámetros de la URL
    const agentId = searchParams.get("agentId");
    if (agentId) {
      params.agentId = agentId;
    }

    return params;
  };

  const handleSubmit = async (formData: FormData) => {
    const messageText = formData.get("message");
    if (!messageText || typeof messageText !== "string" || !messageText.trim())
      return;

    // Cambiar el estado a "sending" y vibrar
    setChatState("sending");
    vibrate();
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
    setTimeout(scrollToBottom, 0);

    // Mostrar el indicador de carga y cambiar el estado a "processing"
    setIsTyping(true);
    setChatState("processing");

    // Configurar un timeout para cambiar a "receiving" después de un segundo
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    processingTimeoutRef.current = setTimeout(() => {
      setChatState("receiving");
    }, 1000);

    // Obtener los parámetros de la URL
    const urlParams = getUrlParams();

    // Enviar el mensaje al servidor en un proceso separado
    // No esperamos a que termine para continuar con la UI
    setTimeout(async () => {
      try {
        // Enviar el mensaje al servidor con los parámetros de la URL
        const response = await sendMessage(
          sessionId,
          messageText,
          undefined,
          urlParams
        );

        if (response.success) {
          // Vibrar al recibir respuesta
          vibrate();

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
          setTimeout(scrollToBottom, 0);

          // Actualizar la base de datos con todos los mensajes
          // Usamos el estado actual para asegurarnos de tener todos los mensajes
          updateMessages([...messages, newMessage, botMessage]);
        } else {
          // Si hay un error en la respuesta
          setIsTyping(false);
          setChatState("error");
          setErrorMessage(response.message || t("error"));
        }
      } catch (error) {
        console.error("Error al enviar el mensaje:", error);
        setIsTyping(false);
        setChatState("error");
        setErrorMessage(t("errorMessage"));
      } finally {
        // Limpiar el timeout si existe
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }
      }
    }, 0);
  };

  // Función para obtener el texto del estado actual
  const getStateText = () => {
    switch (chatState) {
      case "sending":
        return t("sending");
      case "processing":
        return t("processing");
      case "receiving":
        return t("receiving");
      case "error":
        return errorMessage || t("error");
      default:
        return "";
    }
  };

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
              className={cn(
                "flex items-end gap-2",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              {!message.isUser && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  message.isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
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

          {(isTyping || chatState !== "idle") && chatState !== "error" && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {getStateText()}
                  </p>
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
            </div>
          )}

          {chatState === "error" && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-destructive" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-destructive/10">
                <p className="text-sm text-destructive">
                  {errorMessage || t("error")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 shadow-xl">
        <div className="container max-w-3xl mx-auto">
          <MessageInput
            onSubmit={handleSubmit}
            disabled={chatState !== "idle" && chatState !== "error"}
          />
        </div>
      </div>
    </div>
  );
}
