"use client";

import { Setting } from "@/types/settings";
import { ColumnDef } from "@tanstack/react-table";
import { SettingsTable } from "./settings-table";
import { UsersTable } from "../users/users-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Users,
  Paintbrush,
  Globe,
  X,
  Check,
  Moon,
  Sun,
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
import { useCallback, useRef, useTransition } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/language-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SettingsModalProps {
  settings: Setting[];
  users: User[];
  settingsColumns: ColumnDef<Setting>[];
  userColumns?: ColumnDef<User>[];
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}

export function SettingsModal({
  settings,
  users,
  settingsColumns,
  userColumns = [],
  isLoading = false,
  hasError = false,
  onRetry,
}: SettingsModalProps) {
  const { isOpen, closeSettingsModal, activeTab, setActiveTab } =
    useSettingsModal();
  const t = useTranslations("settings");
  const tLanguage = useTranslations("language");
  const tTheme = useTranslations("theme");
  const isClosingRef = useRef(false);
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();
  const [isPending, startTransition] = useTransition();

  // Función para cambiar el idioma
  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      setLocale(newLocale);
    });
  };

  // Función simple para manejar el cierre del modal
  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;

    isClosingRef.current = true;
    closeSettingsModal();

    // Reseteamos la referencia después de un tiempo
    setTimeout(() => {
      isClosingRef.current = false;
    }, 500);
  }, [closeSettingsModal]);

  // Manejador simplificado para cambios en el estado del diálogo
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Manejador simplificado para cambiar pestañas
  const handleTabChange = useCallback(
    (tabId: string) => {
      if (!isClosingRef.current) {
        setActiveTab(tabId);
      }
    },
    [setActiveTab]
  );

  const navItems = [
    { id: "general", name: t("general"), icon: Settings },
    { id: "users", name: t("users"), icon: Users },
    { id: "appearance", name: t("appearance"), icon: Paintbrush },
    { id: "language", name: t("language"), icon: Globe },
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
          onClick={handleClose}
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
                          onClick={() => handleTabChange(item.id)}
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
              ) : hasError ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-destructive mb-4">{t("errorLoading")}</p>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      {t("retry")}
                    </button>
                  )}
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
                  {activeTab === "appearance" && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">
                        {t("appearance")}
                      </h2>
                      <div className="grid gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>{tTheme("title")}</CardTitle>
                            <CardDescription>
                              {tTheme("description")}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <RadioGroup
                              defaultValue={theme}
                              onValueChange={setTheme}
                              className="flex flex-col space-y-3"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="light" id="light" />
                                <Label
                                  htmlFor="light"
                                  className="flex items-center gap-2"
                                >
                                  <Sun className="h-4 w-4" />
                                  {tTheme("light")}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dark" id="dark" />
                                <Label
                                  htmlFor="dark"
                                  className="flex items-center gap-2"
                                >
                                  <Moon className="h-4 w-4" />
                                  {tTheme("dark")}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="system" id="system" />
                                <Label htmlFor="system">
                                  {tTheme("system")}
                                </Label>
                              </div>
                            </RadioGroup>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                  {activeTab === "language" && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">
                        {t("language")}
                      </h2>
                      <div className="grid gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>{tLanguage("title")}</CardTitle>
                            <CardDescription>
                              {tLanguage("description")}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <RadioGroup
                              defaultValue={locale}
                              onValueChange={handleLocaleChange}
                              className="flex flex-col space-y-3"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="en"
                                  id="en"
                                  disabled={isPending}
                                />
                                <Label
                                  htmlFor="en"
                                  className="flex items-center gap-2"
                                >
                                  {tLanguage("en")}
                                  {locale === "en" && (
                                    <Check className="h-4 w-4 ml-2" />
                                  )}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="es"
                                  id="es"
                                  disabled={isPending}
                                />
                                <Label
                                  htmlFor="es"
                                  className="flex items-center gap-2"
                                >
                                  {tLanguage("es")}
                                  {locale === "es" && (
                                    <Check className="h-4 w-4 ml-2" />
                                  )}
                                </Label>
                              </div>
                            </RadioGroup>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                  {activeTab !== "general" &&
                    activeTab !== "users" &&
                    activeTab !== "appearance" &&
                    activeTab !== "language" && (
                      <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold mb-6">
                          {navItems.find((item) => item.id === activeTab)
                            ?.name || t("comingSoon")}
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
