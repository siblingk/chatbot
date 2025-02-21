"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useChat } from "@/contexts/chat-context";

export function NavBar() {
  const { clearChat } = useChat();

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="flex h-12 items-center justify-between px-4">
        <SidebarTrigger className="h-8 w-8" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={clearChat}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Eliminar chat</span>
        </Button>
      </div>
    </nav>
  );
}
