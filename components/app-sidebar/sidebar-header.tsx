"use client";

import { Plus, Box } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SidebarHeader as Header,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useChat } from "@/contexts/chat-context";
import { useUserRole } from "@/hooks/useUserRole";
import { OrganizationSelector } from "./organization-selector";

export function SidebarHeader() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { clearChat } = useChat();
  const { isAdmin } = useUserRole();

  // Verificar si estamos en modo shop (dentro de una organización)
  const isShopMode = pathname.includes("/organizations/");

  // Función para ir a la página principal con chat limpio
  const handleGoHome = async () => {
    await clearChat();
    router.push("/");
  };

  // Si estamos en modo shop, solo mostramos el selector de organización para admins
  if (isShopMode) {
    return (
      <Header>
        <SidebarMenu>
          {isAdmin ? (
            <SidebarMenuItem>
              <OrganizationSelector />
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => router.push("/")}>
                <Box />
                <span>{t("app.title")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </Header>
    );
  }

  // En modo normal, mostramos el selector de organización para admins y el botón de nuevo chat
  return (
    <Header>
      <SidebarMenu>
        {isAdmin ? (
          <>
            <SidebarMenuItem>
              <OrganizationSelector />
            </SidebarMenuItem>
          </>
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleGoHome}>
              <Box />
              <span>{t("app.title")}</span>
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
