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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] overflow-hidden">
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
          <Trash2 className="h-4 w-4 stroke-red-400" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading || isTyping}
          workshopId={workshopId}
        />
      </div>
      <div className="mt-auto">
        <MessageInput onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
