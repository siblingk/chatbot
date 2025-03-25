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

  // Obtener el rol del usuario
  const { data: userRoleData } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  const userRole = userRoleData?.role;
  const isGeneralLead = userRole === "general_lead";
  const isShop = userRole === "shop";
  const isUser = userRole === "user";

  // Obtener el historial de chats para todos los roles (excepto admin/super_admin)
  let groupedHistory: { [key: string]: Message[] } = {};

  if (userId) {
    const history = await getChatHistory(userId);

    // Agrupar mensajes por session_id
    groupedHistory =
      history?.reduce((groups: { [key: string]: Message[] }, message) => {
        const sessionId = message.session_id || "default";
        if (!groups[sessionId]) {
          groups[sessionId] = [];
        }
        // Insertar al inicio del array en lugar de al final
        groups[sessionId].unshift(message);
        return groups;
      }, {}) || {};
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />

      <SidebarContent className="-mt-2">
        {userId && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center w-full">
                  {isShop
                    ? t("sidebar.shopCommands") || "Comandos de Tienda"
                    : isUser
                    ? t("sidebar.userHistory") || "Historial de Usuario"
                    : t("sidebar.chatHistory")}
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                {Object.keys(groupedHistory).length > 0 ? (
                  <SidebarChatList
                    groupedHistory={groupedHistory}
                    userId={userId}
                    userRole={userRole}
                  />
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {isShop
                      ? t("sidebar.noShopCommands") ||
                        "No hay comandos recientes"
                      : t("sidebar.noChats") || "No hay chats recientes"}
                  </div>
                )}
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter user={userData?.user || null} />
    </Sidebar>
  );
}
