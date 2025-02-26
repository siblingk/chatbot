"use client";

import { Setting } from "@/types/settings";
import { ColumnDef } from "@tanstack/react-table";
import { SettingsTable } from "./settings-table";
import { UsersTable } from "../users/users-table";
import { userColumns } from "../users/user-columns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Users,
  Bell,
  Paintbrush,
  MessageCircle,
  Globe,
  Keyboard,
  Lock,
  X,
} from "lucide-react";
import { User } from "@/app/actions/users";
import { useSettingsModal } from "@/contexts/settings-modal-context";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback } from "react";

interface SettingsModalProps {
  settings: Setting[];
  users: User[];
  settingsColumns: ColumnDef<Setting>[];
  isLoading?: boolean;
}

export function SettingsModal({
  settings,
  users,
  settingsColumns,
  isLoading = false,
}: SettingsModalProps) {
  const { isOpen, closeSettingsModal, activeTab, setActiveTab } =
    useSettingsModal();
  const t = useTranslations("settings");

  // Función simple para manejar el cierre del modal
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeSettingsModal();
      }
    },
    [closeSettingsModal]
  );

  const navItems = [
    { id: "general", name: t("general"), icon: Settings },
    { id: "users", name: t("users"), icon: Users },
    { id: "notifications", name: t("notifications"), icon: Bell },
    { id: "appearance", name: t("appearance"), icon: Paintbrush },
    { id: "messages", name: t("messages"), icon: MessageCircle },
    { id: "language", name: t("language"), icon: Globe },
    { id: "accessibility", name: t("accessibility"), icon: Keyboard },
    { id: "privacy", name: t("privacy"), icon: Lock },
  ];

  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[90vh] md:max-w-[90vw] lg:max-w-[90vw]">
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("description")}
        </DialogDescription>
        <button
          onClick={closeSettingsModal}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("close")}</span>
        </button>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveTab(item.id)}
                          isActive={activeTab === item.id}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[80vh] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">{t("title")}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {navItems.find((item) => item.id === activeTab)?.name ||
                          t("general")}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col overflow-y-auto p-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-[250px]" />
                  <Skeleton className="h-[500px] w-full" />
                </div>
              ) : (
                <>
                  {activeTab === "general" && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">
                        {t("generalSettings")}
                      </h2>
                      <SettingsTable
                        settings={settings}
                        columns={settingsColumns}
                      />
                    </div>
                  )}
                  {activeTab === "users" && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">
                        {t("userManagement")}
                      </h2>
                      <UsersTable users={users} columns={userColumns} />
                    </div>
                  )}
                  {activeTab !== "general" && activeTab !== "users" && (
                    <div className="flex flex-col gap-4">
                      <h2 className="text-2xl font-bold mb-6">
                        {navItems.find((item) => item.id === activeTab)?.name ||
                          t("comingSoon")}
                      </h2>
                      <p className="text-muted-foreground">
                        {t("featureNotAvailable")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
