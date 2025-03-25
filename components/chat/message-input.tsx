"use client";

import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Forward } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && !isSubmitting && !disabled) {
      const formData = new FormData();
      formData.append("message", message.trim());
      setIsSubmitting(true);

      // Limpiar el input inmediatamente para mejor UX
      setMessage("");

      // Enfocar el input inmediatamente
      focusInput();

      try {
        // Usar un pequeño retraso para asegurar que la UI se actualice antes de enviar el mensaje
        await onSubmit(formData);
      } catch (error) {
        console.error("Error al enviar el mensaje:", error);
      } finally {
        setIsSubmitting(false);
        // Enfocar el input después de enviar el mensaje
        focusInput();
      }
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="relative mx-auto w-full max-w-3xl flex items-center"
      >
        <div className="relative flex-1 group">
          <Input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("placeholder")}
            autoComplete="off"
            className="h-12 pl-5 pr-12 rounded-full shadow-sm transition-all duration-200 
              border-border/30 focus:border-primary/30 
              bg-background/90 focus:bg-background 
              focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
            disabled={isSubmitting || disabled}
          />

          {message.trim() && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-150">
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 bg-primary rounded-full hover:bg-primary/90 shadow-sm"
                disabled={isSubmitting || disabled}
              >
                <Forward className="h-4 w-4 text-primary-foreground" />
                <span className="sr-only">{t("send")}</span>
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Indicador de comando rápido */}
      <div className="mt-2 text-[10px] text-muted-foreground/60 text-center px-4">
        <span className="inline-flex items-center">
          Presiona{" "}
          <kbd className="mx-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] border border-border/20">
            /
          </kbd>{" "}
          para enfocar
        </span>
      </div>
    </div>
  );
}
