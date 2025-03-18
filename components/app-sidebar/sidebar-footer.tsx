"use client";

import { Settings, ChevronUp, LogIn, Bot } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  SidebarFooter as Footer,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/auth/auth-buttons";
import { useSettingsModal } from "@/contexts/settings-modal-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarFooterProps {
  user: {
    email?: string;
    id: string;
    user_metadata?: {
      avatar_url?: string;
    };
  } | null;
}

export function SidebarFooter({ user }: SidebarFooterProps) {
  const { openSettingsModal } = useSettingsModal();
  const { isAdmin } = useUserRole();
  const t = useTranslations();
  const isMobile = useIsMobile();
  // Obtener las iniciales del email del usuario para el avatar fallback
  const getUserInitials = () => {
    if (!user || !user.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <Footer>
      <SidebarMenu>
        {user ? (
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span>{user.email}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={openSettingsModal}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("sidebar.settings")}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href={`/agents`}>
                      <Bot className="mr-2 h-4 w-4" />
                      {t("settings.agents")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ) : (
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="h-4 w-4 mr-2">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <span>{t("auth.guest")}</span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={openSettingsModal}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("sidebar.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/auth/signin" className="flex items-center gap-4">
                    <LogIn className="h-4 w-4" />
                    {t("auth.signIn")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </Footer>
  );
}
