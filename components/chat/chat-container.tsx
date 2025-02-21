"use client";

import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Message } from "@/types/chat";
import { generateUUID } from "@/lib/utils/uuid";
import {
  sendMessage,
  getOrCreateSessionId,
  getStoredMessages,
  updateMessages,
  clearMessages,
} from "@/app/actions/chat";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ChatContainerProps {
  workshopId?: string;
}

export default function ChatContainer({ workshopId }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    async function initialize() {
      const msgs = await getStoredMessages();
      setMessages(msgs);
      setIsLoading(false);
    }
    initialize();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    const messageText = formData.get("message");
    if (!messageText || typeof messageText !== "string" || !messageText.trim())
      return;

    const sessionId = await getOrCreateSessionId();
    const newMessage: Message = {
      id: generateUUID(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newMessage];
    await updateMessages(updatedMessages);
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const response = await sendMessage(sessionId, messageText);

      if (response.success) {
        const botMessage: Message = {
          id: generateUUID(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
        };

        const messagesWithBot = [...updatedMessages, botMessage];
        await updateMessages(messagesWithBot);
        setMessages(messagesWithBot);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuotationRequest = async () => {
    const formData = new FormData();
    formData.append("message", "Quiero cotizar");
    await handleSubmit(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const hasUserMessages = messages.some((message) => message.isUser);

  return (
    <div className="flex flex-col h-screen pt-2 overflow-hidden">
      <div className="flex justify-end px-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={async () => {
            await clearMessages();
            setMessages([]);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading || isTyping}
          workshopId={workshopId}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm">
        {!hasUserMessages ? (
          <div className="flex flex-col items-center px-4 mb-6 text-center">
            <span className="mb-3 text-sm text-muted-foreground animate-bounce">
              ¡Descubre tu cotización ahora! ✨
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
                  Iniciar cotización
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
