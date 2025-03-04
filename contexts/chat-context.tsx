"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { clearMessages, getStoredMessages } from "@/app/actions/chat";
import { useQueryStates } from "nuqs";
import { chatParams } from "@/lib/url-params";

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearChat: () => Promise<void>;
  agentConfig: Record<string, unknown> | null;
  welcomeMessage: string | null;
  preQuoteMessage: string | null;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [params] = useQueryStates(chatParams);
  const [agentConfig, setAgentConfig] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [preQuoteMessage, setPreQuoteMessage] = useState<string | null>(null);

  // Cargar mensajes y configuración del agente desde la URL
  useEffect(() => {
    async function initialize() {
      const msgs = await getStoredMessages();
      setMessages(msgs);

      // Cargar configuración del agente desde la URL
      if (params.agentConfig) {
        setAgentConfig(params.agentConfig);
      }

      // Cargar mensajes personalizados
      if (params.welcomeMessage) {
        setWelcomeMessage(params.welcomeMessage);
      }

      if (params.preQuoteMessage) {
        setPreQuoteMessage(params.preQuoteMessage);
      }
    }
    initialize();
  }, [params.agentConfig, params.welcomeMessage, params.preQuoteMessage]);

  const clearChat = async () => {
    await clearMessages();
    setMessages([]);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        clearChat,
        agentConfig,
        welcomeMessage,
        preQuoteMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
