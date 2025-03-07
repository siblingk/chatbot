import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { WelcomeMessage } from "@/components/chat/welcome-message";
import { useTranslations } from "next-intl";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  workshopId?: string;
  showWelcome?: boolean;
}

export function MessageList({
  messages,
  isLoading,
  workshopId,
  showWelcome = true,
}: MessageListProps) {
  const t = useTranslations("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSecondMessage, setShowSecondMessage] = useState(false);
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: "auto",
      });
    }
  };

  // Configurar el observador de mutaciones para detectar cambios en el contenido
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new MutationObserver(() => {
      scrollToBottom();
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  // Scroll cuando cambian los mensajes o el estado de carga
  useEffect(() => {
    scrollToBottom();
    // Doble check para asegurar que el scroll llegue al final
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages, isLoading, showSecondMessage]);

  // Scroll periódico mientras está cargando
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(scrollToBottom, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (welcomeLoaded) {
      setTimeout(() => {
        setShowSecondMessage(true);
        scrollToBottom();
      }, 500);
    }
  }, [welcomeLoaded]);

  return (
    <div className="h-full overflow-y-auto relative" ref={scrollRef}>
      <div
        className="container max-w-3xl mx-auto space-y-4 p-4 pb-20"
        ref={containerRef}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {showWelcome && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onAnimationComplete={() => scrollToBottom()}
            >
              <WelcomeMessage
                workshopId={workshopId}
                onLoad={() => setWelcomeLoaded(true)}
              />
            </motion.div>
          )}
          {showWelcome && showSecondMessage && (
            <motion.div
              key="initial-message"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex justify-start mt-4"
              onAnimationComplete={() => scrollToBottom()}
            >
              <div className="max-w-[85%] rounded-2xl px-4 py-2 bg-muted">
                <p className="whitespace-pre-wrap break-words">
                  {t("initialMessage", {
                    defaultValue:
                      "Welcome to the chat! I'm here to help you with your questions and assist you in any way I can.",
                  })}
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
              onAnimationComplete={() => scrollToBottom()}
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
                {message.isUser ? (
                  <p className="whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                ) : (
                  <MarkdownRenderer
                    content={message.text}
                    className={message.isUser ? "text-primary-foreground" : ""}
                  />
                )}
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
              onAnimationComplete={() => scrollToBottom()}
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
