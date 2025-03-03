"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { Agent } from "@/types/agents";
import { generateUUID } from "@/utils/uuid";
import { sendMessage, getOrCreateSessionId } from "@/app/actions/chat";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, RefreshCw } from "lucide-react";

interface AgentChatPreviewProps {
  agent: Partial<Agent>;
}

export default function AgentChatPreview({ agent }: AgentChatPreviewProps) {
  const t = useTranslations("chat");
  const tSettings = useTranslations("settings");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Función para desplazarse al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Desplazarse al final cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicializar el chat con el mensaje de bienvenida del agente
  useEffect(() => {
    if (agent && agent.welcome_message) {
      setMessages([
        {
          id: generateUUID(),
          text: agent.welcome_message,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }

    // Obtener o crear un ID de sesión
    const initSession = async () => {
      const id = await getOrCreateSessionId();
      setSessionId(id);
    };

    initSession();
  }, [agent]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    // Crear mensaje del usuario
    const userMessage: Message = {
      id: generateUUID(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    // Actualizar la interfaz con el mensaje del usuario
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Convertir el agente a un objeto plano para enviarlo como prompt
      const agentPrompt = { ...agent };

      // Enviar mensaje al webhook con la información del agente
      const response = await sendMessage(sessionId, inputValue, agentPrompt);

      if (response.success) {
        // Crear mensaje de respuesta del bot
        const botMessage: Message = {
          id: generateUUID(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
        };

        // Actualizar la interfaz con la respuesta del bot
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // Simular una conversación predefinida
  const simulateConversation = async () => {
    if (!sessionId) return;

    // Mensaje predefinido del usuario
    const userMessage: Message = {
      id: generateUUID(),
      text: "Hola, necesito un presupuesto para reparar mi coche",
      isUser: true,
      timestamp: new Date(),
    };

    // Actualizar la interfaz con el mensaje del usuario
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Convertir el agente a un objeto plano para enviarlo como prompt
      const agentPrompt = { ...agent };

      // Enviar mensaje al webhook con la información del agente
      const response = await sendMessage(
        sessionId,
        "Hola, necesito un presupuesto para reparar mi coche",
        agentPrompt
      );

      if (response.success) {
        // Crear mensaje de respuesta del bot
        const botMessage: Message = {
          id: generateUUID(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
        };

        // Actualizar la interfaz con la respuesta del bot
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error al simular conversación:", error);

      // Si hay un error, mostrar una respuesta predefinida basada en el agente
      const fallbackMessage: Message = {
        id: generateUUID(),
        text:
          agent.pre_quote_message ||
          "Tu estimación de reparación está entre $x, $y",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Función para reiniciar la conversación
  const resetConversation = () => {
    if (agent && agent.welcome_message) {
      setMessages([
        {
          id: generateUUID(),
          text: agent.welcome_message,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border rounded-lg h-full flex flex-col">
      <div className="bg-muted p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">{tSettings("chatPreview")}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetConversation}
          title={t("resetConversation") || "Reiniciar conversación"}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista de mensajes con altura fija y scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            } items-end gap-2`}
          >
            {!message.isUser && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-3 w-3 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 relative group ${
                message.isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
              title={message.timestamp.toLocaleString()}
            >
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
              <span className="absolute bottom-1 right-2 text-[10px] opacity-0 group-hover:opacity-70 transition-opacity">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {message.isUser && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Elemento invisible para hacer scroll al final */}
        <div ref={messagesEndRef} />
      </div>

      {/* Entrada de mensaje - Fija en la parte inferior */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            className="flex-1"
            autoFocus
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={simulateConversation}
          variant="outline"
          className="w-full mt-2"
          disabled={isTyping}
        >
          {tSettings("simulateConversation")}
        </Button>
      </div>
    </div>
  );
}
