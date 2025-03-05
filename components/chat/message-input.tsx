"use client";

import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Forward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface MessageInputProps {
  onSubmit: (formData: FormData) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({
  onSubmit,
  disabled = false,
}: MessageInputProps) {
  const t = useTranslations("chat");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mantener el foco en el input constantemente
  useEffect(() => {
    const focusInput = () => {
      if (
        inputRef.current &&
        document.activeElement !== inputRef.current &&
        !disabled
      ) {
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
  }, [disabled]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() || disabled || isSubmitting) return;

    const formData = new FormData();
    formData.append("message", message);

    // Limpiar el input inmediatamente
    setMessage("");

    // Asegurar que el input esté enfocado después de limpiar
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Marcar como enviando
    setIsSubmitting(true);

    // Enviar el mensaje en un proceso separado
    setTimeout(async () => {
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error("Error al enviar el mensaje:", error);
      } finally {
        setIsSubmitting(false);
      }
    }, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="drop-shadow-xl"
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
              placeholder={t("placeholder")}
              autoComplete="off"
              className="h-14 pl-6 pr-14 rounded-2xl shadow-sm transition-all duration-200 border-muted-foreground/20 focus:bg-muted group-hover:bg-muted"
              disabled={isSubmitting || disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus
            />
            <AnimatePresence mode="wait">
              {isSubmitting ? (
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
                    className="h-8 w-8 rounded-full"
                    disabled={isSubmitting || disabled}
                    aria-label={t("send")}
                  >
                    <Forward className="h-4 w-4" />
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
