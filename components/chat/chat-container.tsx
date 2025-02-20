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
import { motion, AnimatePresence } from "framer-motion";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-10">
      <div className="flex justify-end px-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={async () => {
            await clearMessages();
            setMessages([]);
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpiar chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          isLoading={isLoading || isTyping}
          workshopId={workshopId}
        />
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 py-2 text-sm text-gray-500"
            >
              El asistente está escribiendo...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MessageInput onSubmit={handleSubmit} />
    </div>
  );
}
