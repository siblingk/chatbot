"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Forward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageInputProps {
  onSubmit: (formData: FormData) => Promise<void>;
}

export function MessageInput({ onSubmit }: MessageInputProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessage] = useState("");

  // Mantener el foco en el input constantemente
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Foco inicial
    focusInput();

    // Mantener el foco después de cualquier cambio
    const interval = setInterval(focusInput, 100);

    // Evento para mantener el foco al hacer clic en cualquier parte
    const handleClick = () => {
      setTimeout(focusInput, 0);
    };

    document.addEventListener("click", handleClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;

    const formData = new FormData();
    formData.append("message", message);

    // Limpiar el input inmediatamente
    setMessage("");

    // Procesar el envío
    startTransition(async () => {
      await onSubmit(formData);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky bottom-0 left-0 right-0 p-4"
    >
      <div className="container max-w-3xl mx-auto">
        <motion.form
          ref={formRef}
          onSubmit={handleSubmit}
          className="relative flex items-center"
          layout
        >
          <motion.div
            className="relative flex-1 group"
            animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              autoComplete="off"
              className="h-14 pl-6 pr-14 rounded-2xl shadow-sm transition-all duration-200 border-muted-foreground/20 focus:bg-muted group-hover:bg-muted"
              disabled={isPending}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus
            />
            <AnimatePresence mode="wait">
              {isPending ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-3 top-4"
                >
                  <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </motion.div>
              ) : message.trim() ? (
                <motion.div
                  key="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-3 top-3"
                >
                  <Button
                    type="submit"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-110"
                    disabled={isPending}
                  >
                    <Forward className="h-4 w-4 text-primary-foreground" />
                    <span className="sr-only">Enviar mensaje</span>
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  );
}
