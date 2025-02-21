"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { clearMessages, getStoredMessages } from "@/app/actions/chat";

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearChat: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    async function initialize() {
      const msgs = await getStoredMessages();
      setMessages(msgs);
    }
    initialize();
  }, []);

  const clearChat = async () => {
    await clearMessages();
    setMessages([]);
  };

  return (
    <ChatContext.Provider value={{ messages, setMessages, clearChat }}>
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
