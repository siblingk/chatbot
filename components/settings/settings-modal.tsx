"use client";
import { Setting } from "@/types/settings";
import { ColumnDef } from "@tanstack/react-table";
import { SettingsTable } from "./settings-table";
import { UsersTable } from "../users/users-table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Settings,
  Users,
  Paintbrush,
  Globe,
  Check,
  Moon,
  Sun,
} from "lucide-react";
import { User } from "@/app/actions/users";
import { useSettingsModal } from "@/contexts/settings-modal-context";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useRef, useTransition, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/language-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

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
  const { isAdmin } = useUserRole();

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

  // Filtrar las opciones de navegación según el rol del usuario
  const navItems = useMemo(() => {
    const items = [
      { id: "appearance", name: t("appearance"), icon: Paintbrush },
      { id: "language", name: t("language"), icon: Globe },
    ];

    // Solo los administradores pueden ver las opciones de configuración general y usuarios
    if (isAdmin) {
      items.unshift(
        { id: "general", name: t("general"), icon: Settings },
        { id: "users", name: t("users"), icon: Users }
      );
    }

    return items;
  }, [isAdmin, t]);

  // Asegurarse de que el tab activo sea válido para el rol del usuario
  useEffect(() => {
    if (!isAdmin && (activeTab === "general" || activeTab === "users")) {
      setActiveTab("appearance");
    }
  }, [isAdmin, activeTab, setActiveTab]);

  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col overflow-hidden p-4 h-full">
        {/* Header */}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar para desktop */}
          <aside className="hidden border-r md:block md:w-[200px] lg:w-[240px]">
            <nav className="flex flex-col gap-2 p-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Contenido principal */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Área de contenido scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-4">
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
                  {activeTab === "general" && isAdmin && (
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
                  {activeTab === "users" && isAdmin && (
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
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-medium">
                                {tTheme("title")}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {tTheme("description")}
                              </p>
                            </div>
                          </div>
                          <div className="pl-1">
                            <RadioGroup
                              defaultValue={theme}
                              onValueChange={setTheme}
                              className="flex flex-col space-y-4"
                            >
                              <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent">
                                <RadioGroupItem value="light" id="light" />
                                <Label
                                  htmlFor="light"
                                  className="flex items-center gap-2 cursor-pointer w-full"
                                >
                                  <Sun className="h-4 w-4" />
                                  <span className="flex-1">
                                    {tTheme("light")}
                                  </span>
                                  {theme === "light" && (
                                    <Check className="h-4 w-4 ml-auto text-primary" />
                                  )}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent">
                                <RadioGroupItem value="dark" id="dark" />
                                <Label
                                  htmlFor="dark"
                                  className="flex items-center gap-2 cursor-pointer w-full"
                                >
                                  <Moon className="h-4 w-4" />
                                  <span className="flex-1">
                                    {tTheme("dark")}
                                  </span>
                                  {theme === "dark" && (
                                    <Check className="h-4 w-4 ml-auto text-primary" />
                                  )}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent">
                                <RadioGroupItem value="system" id="system" />
                                <Label
                                  htmlFor="system"
                                  className="flex items-center gap-2 cursor-pointer w-full"
                                >
                                  <span className="flex-1">
                                    {tTheme("system")}
                                  </span>
                                  {theme === "system" && (
                                    <Check className="h-4 w-4 ml-auto text-primary" />
                                  )}
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "language" && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">
                        {t("language")}
                      </h2>
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-medium">
                                {tLanguage("title")}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {tLanguage("description")}
                              </p>
                            </div>
                          </div>
                          <div className="pl-1">
                            <RadioGroup
                              defaultValue={locale}
                              onValueChange={handleLocaleChange}
                              className="flex flex-col space-y-4"
                            >
                              <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent">
                                <RadioGroupItem
                                  value="en"
                                  id="en"
                                  disabled={isPending}
                                />
                                <Label
                                  htmlFor="en"
                                  className="flex items-center gap-2 cursor-pointer w-full"
                                >
                                  <span className="flex-1">
                                    {tLanguage("en")}
                                  </span>
                                  {locale === "en" && (
                                    <Check className="h-4 w-4 ml-auto text-primary" />
                                  )}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent">
                                <RadioGroupItem
                                  value="es"
                                  id="es"
                                  disabled={isPending}
                                />
                                <Label
                                  htmlFor="es"
                                  className="flex items-center gap-2 cursor-pointer w-full"
                                >
                                  <span className="flex-1">
                                    {tLanguage("es")}
                                  </span>
                                  {locale === "es" && (
                                    <Check className="h-4 w-4 ml-auto text-primary" />
                                  )}
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
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

            {/* Footer con navegación móvil deslizable */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
              <div className="overflow-x-auto scrollbar-none">
                <nav className="flex min-w-full items-center px-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        "flex flex-1 w-full flex-col items-center gap-1 p-2 text-xs text-wrap font-medium transition-colors",
                        activeTab === item.id
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md",
                          activeTab === item.id
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
