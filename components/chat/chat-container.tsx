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
} from "@/app/actions/chat";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatContainer() {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    async function initialize() {
      const sid = await getOrCreateSessionId();
      const msgs = await getStoredMessages();
      setSessionId(sid);
      setMessages(msgs);
      setIsLoading(false);
    }
    initialize();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    const messageText = formData.get("message");
    if (!messageText || typeof messageText !== "string" || !messageText.trim())
      return;

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

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center h-screen"
        >
          <div className="text-center space-y-4">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              Cargando conversación...
            </motion.p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col h-screen"
        >
          <div className="flex-1 overflow-hidden">
            <MessageList messages={messages} isLoading={isTyping} />
          </div>
          <MessageInput onSubmit={handleSubmit} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
