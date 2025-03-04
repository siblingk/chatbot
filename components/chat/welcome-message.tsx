"use client";

import { useEffect, useState } from "react";
import { getWelcomeMessage } from "@/app/actions/settings";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { useChat } from "@/contexts/chat-context";

interface WelcomeMessageProps {
  workshopId?: string;
  onLoad?: () => void;
}

export function WelcomeMessage({ workshopId, onLoad }: WelcomeMessageProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { welcomeMessage } = useChat();

  useEffect(() => {
    async function fetchMessage() {
      try {
        // Si hay un mensaje personalizado en el contexto, usarlo
        if (welcomeMessage) {
          setMessage(welcomeMessage);
          setLoading(false);
          onLoad?.();
          return;
        }

        // Si no, obtener el mensaje de bienvenida normal
        const defaultWelcomeMessage = await getWelcomeMessage(workshopId);
        console.log("Mensaje de bienvenida:", defaultWelcomeMessage);
        setMessage(defaultWelcomeMessage);
      } catch (error) {
        console.error("Error fetching welcome message:", error);
      } finally {
        setLoading(false);
        onLoad?.();
      }
    }

    fetchMessage();
  }, [workshopId, onLoad, welcomeMessage]);

  if (loading) {
    return (
      <div className="flex justify-start">
        <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 bg-muted")}>
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 bg-muted")}>
        <p className="whitespace-pre-wrap break-words">{message}</p>
      </div>
    </div>
  );
}
