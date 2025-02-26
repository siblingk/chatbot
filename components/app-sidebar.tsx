"use client";
import {
  Plus,
  AlertTriangle,
  Car,
  Settings,
  User2,
  ChevronUp,
  LogIn,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ThemeToggle } from "./theme/theme-toggle";
import { SignOutButton } from "./auth/auth-buttons";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { useSettingsModal } from "@/contexts/settings-modal-context";

export function AppSidebar() {
  const { user, isEmailVerified } = useAuth();
  const { isAdmin } = useUserRole();
  const { open } = useSidebar();
  const { locale, setLocale } = useLanguage();
  const { openSettingsModal } = useSettingsModal();
  const t = useTranslations();

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
          {/* Selector de idioma como elemento independiente */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setLocale(locale === "es" ? "en" : "es")}
            >
              {locale === "en" ? <span>EN</span> : <span>ES</span>}
              <span>
                {t("language.title")}: {locale === "es" ? "Español" : "English"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={openSettingsModal}>
                <Settings className="h-4 w-4" />
                {t("sidebar.settings")}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 />
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
                  <DropdownMenuItem asChild>
                    <ThemeToggle />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <SignOutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/auth/signin">
                    <LogIn className="h-4 w-4" />
                    {t("auth.signIn")}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
