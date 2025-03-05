"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Car,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteChatSession, updateChatTitle } from "@/app/actions/chat";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Message } from "@/types/chat";

interface SidebarChatListProps {
  groupedHistory: { [key: string]: Message[] };
  userId: string;
}

export function SidebarChatList({
  groupedHistory,
  userId,
}: SidebarChatListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Función para eliminar una sesión de chat
  const handleDeleteChat = async (sessionId: string) => {
    await deleteChatSession(userId, sessionId);
    router.refresh(); // Actualizar la UI después de eliminar
  };

  // Función para iniciar la edición del título
  const startEditing = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setNewTitle(currentTitle);
  };

  // Función para guardar el nuevo título
  const saveTitle = async (sessionId: string) => {
    if (newTitle.trim()) {
      await updateChatTitle(userId, sessionId, newTitle);
      setEditingSessionId(null);
      router.refresh(); // Actualizar la UI después de editar
    }
  };

  // Función para cancelar la edición
  const cancelEditing = () => {
    setEditingSessionId(null);
  };

  return (
    <SidebarMenu>
      {Object.entries(groupedHistory).length > 0 ? (
        Object.entries(groupedHistory).map(([sessionId, messages]) => {
          // Buscar un mensaje con título
          const messageWithTitle = messages.find((msg) => msg.title);

          // Obtener el título del chat (título personalizado, primer mensaje o "Nuevo chat")
          const chatTitle =
            messageWithTitle?.title ||
            messages[0]?.input ||
            t("chat.newConversation");

          return (
            <SidebarMenuItem key={sessionId} className="group relative">
              {editingSessionId === sessionId ? (
                <div className="flex items-center w-full gap-2 px-2">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => saveTitle(sessionId)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={cancelEditing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <SidebarMenuButton
                    asChild
                    className={isCollapsed ? "" : "pr-8"}
                  >
                    <Link href={`/chat/${sessionId}`}>
                      <Car className="h-4 w-4" />
                      <span className="truncate">{chatTitle}</span>
                    </Link>
                  </SidebarMenuButton>

                  {!isCollapsed && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => startEditing(sessionId, chatTitle)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("sidebar.rename")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteChat(sessionId)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("sidebar.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </>
              )}
            </SidebarMenuItem>
          );
        })
      ) : (
        <div className="px-3 py-2">
          <div className="text-sm text-muted-foreground mb-2">
            {t("sidebar.noChats")}
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/">
              <Plus className="h-4 w-4 mr-2" />
              {t("chat.newChat")}
            </Link>
          </Button>
        </div>
      )}
    </SidebarMenu>
  );
}
