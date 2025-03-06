"use client";

import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Forward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSubmit: (formData: FormData) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({
  onSubmit,
  disabled = false,
  className,
}: MessageInputProps) {
  const t = useTranslations("chat");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Función para enfocar el input
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Enfocar el input al cargar el componente
  useEffect(() => {
    focusInput();
  }, []);

  // Manejar el evento de tecla para enfocar el input con la tecla /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        focusInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClick = () => {
    if (message.trim() && !isSubmitting && !disabled) {
      const formData = new FormData();
      formData.append("message", message.trim());
      setIsSubmitting(true);
      setMessage("");

      // Enviar el mensaje después de un pequeño retraso para la animación
      setTimeout(async () => {
        try {
          await onSubmit(formData);
        } catch (error) {
          console.error("Error al enviar el mensaje:", error);
        } finally {
          setIsSubmitting(false);
        }
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && !isSubmitting && !disabled) {
      const formData = new FormData();
      formData.append("message", message.trim());
      setIsSubmitting(true);
      setMessage("");

      // Enviar el mensaje después de un pequeño retraso para la animación
      setTimeout(async () => {
        try {
          await onSubmit(formData);
        } catch (error) {
          console.error("Error al enviar el mensaje:", error);
        } finally {
          setIsSubmitting(false);
        }
      }, 0);
    }
  };

  return (
    <div className={cn("w-full", className)}>
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
            className="h-12 pl-5 pr-12 rounded-full shadow-sm transition-all duration-200 border-muted-foreground/10 focus:border-primary/30 bg-background/90 focus:bg-background"
            disabled={isSubmitting || disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <AnimatePresence>
            {message.trim() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-3 top-2 -translate-y-1/2"
              >
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 bg-primary rounded-full hover:bg-primary/90"
                  disabled={isSubmitting || disabled}
                  onClick={handleClick}
                >
                  <Forward className="h-4 w-4 text-primary-foreground" />
                  <span className="sr-only">{t("send")}</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.form>
    </div>
  );
}
