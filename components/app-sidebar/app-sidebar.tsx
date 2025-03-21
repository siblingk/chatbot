import { getChatHistory } from "@/app/actions/chat";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Message } from "@/types/chat";
import { SidebarChatList } from "./sidebar-chat-list";
import { SidebarHeader } from "./sidebar-header";
import { SidebarFooter } from "./sidebar-footer";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function AppSidebar() {
  const t = await getTranslations();
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id ?? "";

  // Obtener el historial de chats
  const history = await getChatHistory(userId);

  // Agrupar mensajes por session_id
  const groupedHistory =
    history?.reduce((groups: { [key: string]: Message[] }, message) => {
      const sessionId = message.session_id || "default";
      if (!groups[sessionId]) {
        groups[sessionId] = [];
      }
      // Insertar al inicio del array en lugar de al final
      groups[sessionId].unshift(message);
      return groups;
    }, {}) || {};

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />

      <SidebarContent className="-mt-2">
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center w-full">
                {t("sidebar.chatHistory")}
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              {Object.keys(groupedHistory).length > 0 && (
                <SidebarChatList
                  groupedHistory={groupedHistory}
                  userId={userId}
                />
              )}
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter user={userData?.user || null} />
    </Sidebar>
  );
}
