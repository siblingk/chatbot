"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { Agent } from "@/types/agents";
import { generateUUID } from "@/utils/uuid";
import { sendMessage, getOrCreateSessionId } from "@/app/actions/chat";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, RefreshCw, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserRole } from "@/hooks/useUserRole";

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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const { isAdmin } = useUserRole();

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

  // Desplazarse al final cuando cambian los mensajes
  useEffect(() => {
    console.log(
      "AgentChatPreview - useEffect [messages] - Mensajes actualizados:",
      messages
    );

    // Forzar una actualización del DOM
    const forceUpdate = () => {
      const container = document.getElementById("chat-messages-container");
      if (container) {
        // Esto fuerza un reflow
        void container.offsetHeight;
        console.log("AgentChatPreview - useEffect [messages] - Forzado reflow");
      }
    };

    forceUpdate();

    // Usar setTimeout para asegurar que el DOM se ha actualizado antes de hacer scroll
    setTimeout(() => {
      console.log("AgentChatPreview - useEffect [messages] - Scroll realizado");

      // Verificar que los mensajes se muestran correctamente
      const messagesContainer = document.getElementById(
        "chat-messages-container"
      );
      if (messagesContainer) {
        const messageElements = messagesContainer.querySelectorAll(
          ".whitespace-pre-wrap"
        );
        console.log(
          `AgentChatPreview - useEffect [messages] - Encontrados ${messageElements.length} elementos de mensaje`
        );

        // Verificar que el número de elementos coincide con el número de mensajes
        if (messageElements.length !== messages.length) {
          console.warn(
            `AgentChatPreview - useEffect [messages] - Discrepancia: ${messageElements.length} elementos vs ${messages.length} mensajes`
          );
        }
      }
    }, 100);
  }, [messages]);

  // Inicializar el chat con el mensaje de bienvenida del agente
  useEffect(() => {
    console.log("AgentChatPreview - useEffect [agent] - Inicializando chat");
    console.log(
      "AgentChatPreview - useEffect [agent] - Agent:",
      JSON.stringify(agent)
    );
    console.log("AgentChatPreview - useEffect [agent] - isAdmin:", isAdmin);

    // Para administradores, solo mostrar una advertencia pero NUNCA bloquear la interacción
    if (isAdmin && agent && agent.is_active === false) {
      // Para administradores, mostrar una advertencia pero permitir la previsualización
      setError(t("adminViewingInactiveAgent"));
    } else if (!isAdmin && agent && agent.is_active === false) {
      // Para usuarios normales, bloquear completamente si el agente está inactivo
      setError(t("agentNotActive"));
      return;
    } else {
      setError(null);
    }

    // Priorizar el mensaje de bienvenida de los parámetros de URL si existe
    const welcomeMessage =
      (urlParams.welcome_message as string) || agent?.welcome_message;

    console.log(
      "AgentChatPreview - useEffect [agent] - Mensaje de bienvenida:",
      welcomeMessage
    );

    if (welcomeMessage) {
      const initialMessage = {
        id: generateUUID(),
        text: welcomeMessage,
        isUser: false,
        timestamp: new Date(),
        session_id: sessionId || "",
      };

      console.log(
        "AgentChatPreview - useEffect [agent] - Mensaje inicial:",
        initialMessage
      );
      setMessages([initialMessage]);
    }

    // Obtener o crear un ID de sesión
    const initSession = async () => {
      const id = await getOrCreateSessionId();
      console.log(
        "AgentChatPreview - useEffect [agent] - Session ID obtenido:",
        id
      );
      setSessionId(id);
    };

    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, urlParams.welcome_message, t, isAdmin]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    console.log(
      "AgentChatPreview - handleSendMessage - Iniciando envío de mensaje"
    );
    console.log("AgentChatPreview - handleSendMessage - sessionId:", sessionId);
    console.log(
      "AgentChatPreview - handleSendMessage - Agent:",
      JSON.stringify(agent)
    );

    // Para usuarios no administradores, bloquear el envío si el agente está inactivo
    if (!isAdmin && agent && agent.is_active === false) {
      setError(t("agentNotActive"));
      return;
    }
    // Los administradores pueden enviar mensajes a agentes inactivos

    // Crear mensaje del usuario
    const userMessage: Message = {
      id: generateUUID(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
      session_id: sessionId,
    };

    // Actualizar la interfaz con el mensaje del usuario
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Convertir el agente a un objeto plano para enviarlo como prompt
      const agentPrompt = { ...agent };

      // Asegurar que el agentPrompt incluya el id del agente
      if (agent.id) {
        agentPrompt.id = agent.id;
        console.log(
          "AgentChatPreview - handleSendMessage - ID del agente en prompt:",
          agent.id
        );
      } else {
        console.error("ERROR: El agente no tiene ID");
      }

      // Preparar los parámetros de URL
      const updatedUrlParams = { ...urlParams };

      // CRÍTICO: Asegurar que siempre se envía el agentId
      if (agent.id) {
        updatedUrlParams.agentId = agent.id;
        console.log("Estableciendo agentId en urlParams:", agent.id);
      } else {
        console.error("ERROR: El agente no tiene ID");
      }

      // Para administradores, asegurarnos de que se envía la información de que es admin
      if (isAdmin) {
        updatedUrlParams.isAdmin = true;
        console.log("Estableciendo isAdmin=true en urlParams");
      }

      console.log("Enviando mensaje como admin:", isAdmin);
      console.log("Agent ID:", agent.id);
      console.log("Agent target_role:", agent.target_role);
      console.log("Agent is_active:", agent.is_active);
      console.log("URL Params completos:", updatedUrlParams);
      console.log("Agent Prompt completo:", agentPrompt);

      // Enviar mensaje al webhook con la información del agente y los parámetros de URL
      console.log(
        "AgentChatPreview - handleSendMessage - Llamando a sendMessage"
      );
      const response = await sendMessage(
        sessionId,
        inputValue,
        agentPrompt,
        updatedUrlParams
      );
      console.log(
        "AgentChatPreview - handleSendMessage - Respuesta:",
        response
      );

      if (response.success) {
        // Verificar que el mensaje no está vacío
        if (!response.message) {
          console.error(
            "AgentChatPreview - El mensaje de respuesta está vacío"
          );
          setError(t("errorMessage") || "Error: Respuesta vacía del servidor");
          return;
        }

        console.log(
          "AgentChatPreview - Mensaje de respuesta recibido:",
          response.message
        );

        // Crear mensaje de respuesta del bot
        const botMessage: Message = {
          id: generateUUID(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          session_id: sessionId,
        };

        console.log("AgentChatPreview - Mensaje del bot creado:", botMessage);

        // Actualizar la interfaz con la respuesta del bot
        setMessages((prev) => {
          console.log("AgentChatPreview - Mensajes previos:", prev);
          const newMessages = [...prev, botMessage];
          console.log("AgentChatPreview - Nuevos mensajes:", newMessages);
          return newMessages;
        });
      } else {
        // Mostrar mensaje de error si la respuesta no fue exitosa
        setError(response.message);
        console.error(
          "AgentChatPreview - handleSendMessage - Error en la respuesta:",
          response.message
        );
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setError(t("errorMessage"));
    } finally {
      setIsTyping(false);
    }
  };

  // Simular una conversación predefinida
  const simulateConversation = async () => {
    if (!sessionId) return;

    console.log(
      "AgentChatPreview - simulateConversation - Iniciando simulación"
    );
    console.log(
      "AgentChatPreview - simulateConversation - sessionId:",
      sessionId
    );
    console.log(
      "AgentChatPreview - simulateConversation - Agent:",
      JSON.stringify(agent)
    );

    // Para usuarios no administradores, bloquear la simulación si el agente está inactivo
    if (!isAdmin && agent && agent.is_active === false) {
      setError(t("agentNotActive"));
      return;
    }
    // Los administradores pueden simular conversaciones con agentes inactivos

    // Mensaje predefinido del usuario
    const userMessage: Message = {
      id: generateUUID(),
      text: "Hola, necesito un presupuesto para reparar mi coche",
      isUser: true,
      timestamp: new Date(),
      session_id: sessionId,
    };

    // Actualizar la interfaz con el mensaje del usuario
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Convertir el agente a un objeto plano para enviarlo como prompt
      const agentPrompt = { ...agent };

      // Asegurar que el agentPrompt incluya el id del agente
      if (agent.id) {
        agentPrompt.id = agent.id;
        console.log(
          "AgentChatPreview - simulateConversation - ID del agente en prompt:",
          agent.id
        );
      } else {
        console.error("ERROR: El agente no tiene ID");
      }

      // Preparar los parámetros de URL
      const updatedUrlParams = { ...urlParams };

      // CRÍTICO: Asegurar que siempre se envía el agentId
      if (agent.id) {
        updatedUrlParams.agentId = agent.id;
        console.log("Estableciendo agentId en urlParams:", agent.id);
      } else {
        console.error("ERROR: El agente no tiene ID");
      }

      // Para administradores, asegurarnos de que se envía la información de que es admin
      if (isAdmin) {
        updatedUrlParams.isAdmin = true;
        console.log("Estableciendo isAdmin=true en urlParams");
      }

      console.log("Simulando conversación como admin:", isAdmin);
      console.log("Agent ID:", agent.id);
      console.log("Agent target_role:", agent.target_role);
      console.log("Agent is_active:", agent.is_active);
      console.log("URL Params completos:", updatedUrlParams);
      console.log("Agent Prompt completo:", agentPrompt);

      // Enviar mensaje al webhook con la información del agente y los parámetros de URL
      console.log(
        "AgentChatPreview - simulateConversation - Llamando a sendMessage"
      );
      const response = await sendMessage(
        sessionId,
        "Hola, necesito un presupuesto para reparar mi coche",
        agentPrompt,
        updatedUrlParams
      );
      console.log(
        "AgentChatPreview - simulateConversation - Respuesta:",
        response
      );

      if (response.success) {
        // Verificar que el mensaje no está vacío
        if (!response.message) {
          console.error(
            "AgentChatPreview - simulateConversation - El mensaje de respuesta está vacío"
          );
          setError(t("errorMessage") || "Error: Respuesta vacía del servidor");
          return;
        }

        console.log(
          "AgentChatPreview - simulateConversation - Mensaje de respuesta recibido:",
          response.message
        );

        // Crear mensaje de respuesta del bot
        const botMessage: Message = {
          id: generateUUID(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          session_id: sessionId,
        };

        console.log(
          "AgentChatPreview - simulateConversation - Mensaje del bot creado:",
          botMessage
        );

        // Actualizar la interfaz con la respuesta del bot
        setMessages((prev) => {
          console.log(
            "AgentChatPreview - simulateConversation - Mensajes previos:",
            prev
          );
          const newMessages = [...prev, botMessage];
          console.log(
            "AgentChatPreview - simulateConversation - Nuevos mensajes:",
            newMessages
          );
          return newMessages;
        });
      } else {
        // Mostrar mensaje de error si la respuesta no fue exitosa
        setError(response.message);
        console.error(
          "AgentChatPreview - simulateConversation - Error en la respuesta:",
          response.message
        );
      }
    } catch (error) {
      console.error("Error al simular conversación:", error);
      setError(t("errorMessage"));

      // Si hay un error, mostrar una respuesta predefinida basada en el agente o los parámetros de URL
      const fallbackMessage: Message = {
        id: generateUUID(),
        text:
          (urlParams.pre_quote_message as string) ||
          agent.pre_quote_message ||
          "Tu estimación de reparación está entre $x, $y",
        isUser: false,
        timestamp: new Date(),
        session_id: sessionId,
      };

      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Función para reiniciar la conversación
  const resetConversation = () => {
    console.log(
      "AgentChatPreview - resetConversation - Reiniciando conversación"
    );

    // Priorizar el mensaje de bienvenida de los parámetros de URL si existe
    const welcomeMessage =
      (urlParams.welcome_message as string) || agent?.welcome_message;

    console.log(
      "AgentChatPreview - resetConversation - Mensaje de bienvenida:",
      welcomeMessage
    );

    if (welcomeMessage) {
      const initialMessage = {
        id: generateUUID(),
        text: welcomeMessage,
        isUser: false,
        timestamp: new Date(),
        session_id: sessionId || "",
      };

      console.log(
        "AgentChatPreview - resetConversation - Mensaje inicial:",
        initialMessage
      );
      setMessages([initialMessage]);

      // Limpiar cualquier error que pudiera estar mostrándose
      setError(null);
    } else {
      setMessages([]);
      // Limpiar cualquier error que pudiera estar mostrándose
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
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

      {/* Mostrar alerta de error si existe */}
      {error && (
        <Alert variant="destructive" className="m-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de mensajes con altura fija y scroll */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]"
        id="chat-messages-container"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>{t("noMessages") || "No hay mensajes"}</p>
          </div>
        ) : (
          <>
            {console.log("AgentChatPreview - Renderizando mensajes:", messages)}
            {messages.map((message) => {
              console.log("AgentChatPreview - Renderizando mensaje:", message);
              return (
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
                    <p className="whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
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
              );
            })}
          </>
        )}

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
        <div ref={messagesEndRef} id="messages-end" />
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
