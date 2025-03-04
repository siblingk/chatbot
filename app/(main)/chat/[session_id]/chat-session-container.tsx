"use client";

import { useState, useEffect, useRef } from "react";
import { MessageInput } from "@/components/chat/message-input";
import { sendMessage, updateMessages } from "@/app/actions/chat";
import { generateUUID } from "@/utils/uuid";
import { Message } from "@/types/chat";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ChatSessionContainer({
  sessionId,
  initialMessages,
}: ChatSessionContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Función para hacer vibrar el dispositivo
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    const messageText = formData.get("message");
    if (!messageText || typeof messageText !== "string" || !messageText.trim())
      return;

    // Vibrar al enviar mensaje
    vibrate();

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

    // Mostrar el indicador de carga
    setIsTyping(true);

    try {
      // Enviar el mensaje al servidor
      const response = await sendMessage(sessionId, messageText);

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

        // Ocultar el indicador de carga y mostrar el mensaje del bot
        setIsTyping(false);
        setMessages([...updatedMessages, botMessage]);

        // Actualizar la base de datos con todos los mensajes
        updateMessages([...updatedMessages, botMessage]);
      }
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      setIsTyping(false);
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
        <div className="container max-w-3xl mx-auto">
          <MessageInput onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
