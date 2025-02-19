import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto" ref={scrollRef}>
      <div className="container max-w-3xl mx-auto space-y-4 p-4 pb-6">
        <AnimatePresence mode="popLayout" initial={false}>
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
