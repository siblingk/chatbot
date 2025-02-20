import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { WelcomeMessage } from "@/components/chat/welcome-message";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  workshopId?: string;
}

export function MessageList({
  messages,
  isLoading,
  workshopId,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSecondMessage, setShowSecondMessage] = useState(false);
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);

  useEffect(() => {
    if (welcomeLoaded) {
      setTimeout(() => setShowSecondMessage(true), 500);
    }
  }, [welcomeLoaded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading, showSecondMessage]);

  return (
    <div className="h-full overflow-y-auto" ref={scrollRef}>
      <div className="container max-w-3xl mx-auto space-y-4 p-4 pb-6">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <WelcomeMessage
              workshopId={workshopId}
              onLoad={() => setWelcomeLoaded(true)}
            />
          </motion.div>
          {showSecondMessage && (
            <motion.div
              key="initial-message"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex justify-start mt-4"
            >
              <div className="max-w-[85%] rounded-2xl px-4 py-2 bg-muted">
                <p className="whitespace-pre-wrap break-words">
                  ¿En qué puedo ayudarte hoy? Estoy aquí para responder tus
                  preguntas y asistirte en lo que necesites.
                </p>
              </div>
            </motion.div>
          )}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              <motion.div
                layout
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2",
                  message.isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              </motion.div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] rounded-2xl px-4 py-2 bg-muted">
                <Loader />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
