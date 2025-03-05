"use client";

import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Forward, Sparkles } from "lucide-react";
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
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.form
        ref={formRef}
        onSubmit={handleSubmit}
        className="relative mx-auto w-full max-w-3xl flex items-center"
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="relative flex-1 group"
          whileTap={{ scale: 0.98 }}
        >
          <Input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("placeholder")}
            autoComplete="off"
            className="h-12 pl-5 pr-12 rounded-full shadow-sm transition-all duration-200 border-muted-foreground/10 focus:border-primary/30 bg-background focus:bg-background"
            disabled={isSubmitting || disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
          />
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute right-3 top-3"
              >
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </motion.div>
            ) : message.trim() ? (
              <motion.div
                key="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute right-3 top-2.5"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    type="submit"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-primary hover:bg-primary/90"
                    disabled={isSubmitting || disabled}
                    aria-label={t("send")}
                  >
                    <Forward className="h-3.5 w-3.5 text-primary-foreground" />
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="sparkle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="absolute right-3.5 top-3.5"
              >
                <Sparkles className="h-5 w-5 text-primary/40" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}
