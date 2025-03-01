"use client";

export const dynamic = "force-dynamic";

import {
  Plus,
  AlertTriangle,
  Car,
  Settings,
  ChevronUp,
  LogIn,
  Bot,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarMenuAction,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

import { useAuth } from "@/contexts/auth-context";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { SignOutButton } from "./auth/auth-buttons";
import Link from "next/link";
import { useSettingsModal } from "@/contexts/settings-modal-context";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function AppSidebar() {
  const { user, isEmailVerified } = useAuth();
  const { isAdmin } = useUserRole();
  const { open } = useSidebar();
  const { openSettingsModal } = useSettingsModal();
  const t = useTranslations();

  // Obtener las iniciales del email del usuario para el avatar fallback
  const getUserInitials = () => {
    if (!user || !user.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <Car />
                <span>{t("app.title")}</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuAction>
              <Plus />
              <span className="sr-only">{t("common.add")}</span>
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {user && !isEmailVerified && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t("sidebar.verifyEmail")}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => window.location.reload()}
              >
                {t("sidebar.reload")}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </SidebarContent>

      {/* Pie de barra lateral que contiene el menú de usuario */}
      <SidebarFooter>
        <SidebarMenu>
          {/* El selector de idioma se ha movido al modal de configuraciones */}

          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <span>{user.email}</span>
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side={open ? "top" : "right"}
                  align={open ? "start" : "end"}
                  className={`${
                    open ? "w-[--radix-popper-anchor-width]" : "w-full"
                  }`}
                >
                  <DropdownMenuItem onClick={openSettingsModal}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("sidebar.settings")}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href={`/agents/${user?.id}`}>
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
            <>
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
                    side={open ? "top" : "right"}
                    align={open ? "start" : "end"}
                    className={`${
                      open ? "w-[--radix-popper-anchor-width]" : "w-full"
                    }`}
                  >
                    <DropdownMenuItem onClick={openSettingsModal}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t("sidebar.settings")}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/auth/signin"
                        className="flex items-center gap-4"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        {t("auth.signIn")}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
