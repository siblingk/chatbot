"use client";

import { useEffect, useState } from "react";
import { getWelcomeMessage } from "@/app/actions/settings";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";

interface WelcomeMessageProps {
  workshopId?: string;
  onLoad?: () => void;
}

export function WelcomeMessage({ workshopId, onLoad }: WelcomeMessageProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMessage() {
      try {
        const welcomeMessage = await getWelcomeMessage(workshopId);
        console.log("Mensaje de bienvenida:", welcomeMessage);
        setMessage(welcomeMessage);
      } catch (error) {
        console.error("Error fetching welcome message:", error);
      } finally {
        setLoading(false);
        onLoad?.();
      }
    }

    fetchMessage();
  }, [workshopId, onLoad]);

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
