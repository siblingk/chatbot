"use client";

import { Plus, Box } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SidebarHeader as Header,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useChat } from "@/contexts/chat-context";
import { useUserRole } from "@/hooks/useUserRole";
import { OrganizationSelector } from "./organization-selector";
import { useOrganization } from "@/contexts/organization-context";

export function SidebarHeader() {
  const t = useTranslations();
  const router = useRouter();
  const { clearChat } = useChat();
  const { isAdmin } = useUserRole();
  const { currentOrganization } = useOrganization();

  // Función para ir a la página principal con chat limpio
  const handleGoHome = async () => {
    await clearChat();
    router.push("/");
  };

  return (
    <Header>
      <SidebarMenu>
        {isAdmin ? (
          <>
            <SidebarMenuItem>
              <OrganizationSelector />
            </SidebarMenuItem>
            <SidebarSeparator className="my-2" />
          </>
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleGoHome}>
              <Box />
              <span>
                {currentOrganization && isAdmin
                  ? currentOrganization.name
                  : t("app.title")}
              </span>
            </SidebarMenuButton>
            <SidebarMenuAction onClick={handleGoHome}>
              <Plus />
              <span className="sr-only">{t("common.add")}</span>
            </SidebarMenuAction>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </Header>
  );
}
