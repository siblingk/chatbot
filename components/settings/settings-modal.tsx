"use client";
import { Setting } from "@/types/settings";
import { ColumnDef } from "@tanstack/react-table";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Settings,
  Check,
  Moon,
  Sun,
  Bell,
  Link,
  MessageSquare,
  Shield,
  Receipt,
} from "lucide-react";
import { User } from "@/app/actions/users";
import { useSettingsModal } from "@/contexts/settings-modal-context";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useTransition, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/language-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ConnectedAppsTab } from "./connected-apps-tab";
import { ConnectedAppsConfig } from "@/types/connected-apps";
import { TwilioSendGridTab } from "./twilio-sendgrid-tab";
import { TwilioSendGridConfig } from "@/types/twilio-sendgrid";
import { SecurityTab } from "./security-tab";
import { SecurityConfig } from "@/types/security";
import { SubscriptionBillingTab } from "./subscription-billing-tab";
import { SubscriptionBillingConfig } from "@/types/subscription-billing";

interface SettingsModalProps {
  settings: Setting[];
  settingsColumns: ColumnDef<Setting>[];
  userColumns?: ColumnDef<User>[];
  connectedAppsConfig?: ConnectedAppsConfig;
  onUpdateConnectedApps?: (
    config: Partial<ConnectedAppsConfig>
  ) => Promise<void>;
  twilioSendGridConfig?: TwilioSendGridConfig;
  onUpdateTwilioSendGrid?: (
    config: Partial<TwilioSendGridConfig>
  ) => Promise<void>;
  securityConfig?: SecurityConfig;
  onUpdateSecurity?: (config: Partial<SecurityConfig>) => Promise<void>;
  onLogoutSession?: (device: string) => Promise<void>;
  onUpdateUserRole?: (userId: string, role: string) => Promise<void>;
  onRemoveUser?: (userId: string) => Promise<void>;
  subscriptionBillingConfig?: SubscriptionBillingConfig;
  onUpdateSubscriptionBilling?: (
    config: Partial<SubscriptionBillingConfig>
  ) => Promise<void>;
  onChangePlan?: () => Promise<void>;
  onUpdatePaymentInfo?: () => Promise<void>;
  hasError?: boolean;
  onRetry?: () => void;
}

export function SettingsModal({
  connectedAppsConfig,
  onUpdateConnectedApps,
  twilioSendGridConfig,
  onUpdateTwilioSendGrid,
  securityConfig,
  onUpdateSecurity,
  onLogoutSession,
  onUpdateUserRole,
  onRemoveUser,
  subscriptionBillingConfig,
  onUpdateSubscriptionBilling,
  onChangePlan,
  onUpdatePaymentInfo,
  hasError = false,
  onRetry,
}: SettingsModalProps) {
  const { isOpen, closeSettingsModal, activeTab, setActiveTab } =
    useSettingsModal();
  const t = useTranslations("settings");
  const tLanguage = useTranslations("language");
  const tTheme = useTranslations("theme");
  const tNotifications = useTranslations("notifications");
  const isClosingRef = useRef(false);
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const { isAdmin, isSuperAdmin } = useUserRole();

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
    const options = [{ value: "general", label: t("general"), icon: Settings }];

    if (isAdmin || isSuperAdmin) {
      options.push(
        {
          value: "notifications",
          label: t("notifications"),
          icon: Bell,
        },
        {
          value: "connected_apps",
          label: t("connectedApps"),
          icon: Link,
        },

        {
          value: "twilio_sendgrid",
          label: t("twilioSendgrid"),
          icon: MessageSquare,
        },
        { value: "security", label: t("security"), icon: Shield },
        {
          value: "subscription_billing",
          label: t("subscriptionBilling"),
          icon: Receipt,
        }
      );
    }

    return options;
  }, [isAdmin, isSuperAdmin, t]);

  // Asegurarse de que el tab activo sea válido para el rol del usuario
  useEffect(() => {
    if (
      !isAdmin &&
      !isSuperAdmin &&
      (activeTab === "workshops" || activeTab === "shop_members")
    ) {
      setActiveTab("general");
    }
  }, [isAdmin, isSuperAdmin, activeTab, setActiveTab]);

  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col p-0 overflow-hidden h-full lg:h-[90vh] lg:w-[80vw]">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar para desktop */}
          <aside className="hidden border-r md:block md:w-[200px] bg-sidebar lg:w-[240px]">
            <nav className="flex flex-col gap-2 p-4">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleTabChange(item.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === item.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Contenido principal */}
          <div className="flex flex-1 flex-col overflow-hidden bg-background p-4">
            {/* Área de contenido scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-4">
              {hasError ? (
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
                  {activeTab === "connected_apps" &&
                    (isAdmin || isSuperAdmin) && (
                      <div>
                        <h2 className="text-2xl font-bold mb-6">
                          {t("connectedApps")}
                        </h2>
                        <ConnectedAppsTab
                          config={connectedAppsConfig}
                          onUpdate={onUpdateConnectedApps}
                        />
                      </div>
                    )}
                  {activeTab === "twilio_sendgrid" &&
                    (isAdmin || isSuperAdmin) && (
                      <div>
                        <h2 className="text-2xl font-bold mb-6">
                          {t("twilioSendgrid")}
                        </h2>
                        <TwilioSendGridTab
                          config={twilioSendGridConfig}
                          onUpdate={onUpdateTwilioSendGrid}
                        />
                      </div>
                    )}
                  {activeTab === "security" && (isAdmin || isSuperAdmin) && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">
                        {t("security")}
                      </h2>
                      <SecurityTab
                        config={securityConfig}
                        onUpdate={onUpdateSecurity}
                        onLogoutSession={onLogoutSession}
                        onUpdateUserRole={onUpdateUserRole}
                        onRemoveUser={onRemoveUser}
                      />
                    </div>
                  )}
                  {activeTab === "subscription_billing" &&
                    (isAdmin || isSuperAdmin) && (
                      <div>
                        <h2 className="text-2xl font-bold mb-6">
                          {t("subscriptionBilling")}
                        </h2>
                        <SubscriptionBillingTab
                          config={subscriptionBillingConfig}
                          onUpdate={onUpdateSubscriptionBilling}
                          onChangePlan={onChangePlan}
                          onUpdatePaymentInfo={onUpdatePaymentInfo}
                          locale={locale}
                        />
                      </div>
                    )}
                  {activeTab === "general" && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">
                        {t("generalSettings")}
                      </h2>
                      <div className="space-y-8">
                        {/* Sección de Apariencia */}
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

                        {/* Sección de Idioma */}
                        <div className="space-y-4 pt-6 border-t">
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
                                <RadioGroupItem
                                  value="light"
                                  id="light-appearance"
                                />
                                <Label
                                  htmlFor="light-appearance"
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
                                <RadioGroupItem
                                  value="dark"
                                  id="dark-appearance"
                                />
                                <Label
                                  htmlFor="dark-appearance"
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
                                <RadioGroupItem
                                  value="system"
                                  id="system-appearance"
                                />
                                <Label
                                  htmlFor="system-appearance"
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
                                  id="en-language"
                                  disabled={isPending}
                                />
                                <Label
                                  htmlFor="en-language"
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
                                  id="es-language"
                                  disabled={isPending}
                                />
                                <Label
                                  htmlFor="es-language"
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
                  {activeTab === "notifications" && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">
                        {t("notifications")}
                      </h2>
                      <div className="space-y-8">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium mb-4">
                              {tNotifications("notificationTypes")}
                            </h3>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox id="new-lead" />
                              <Label
                                htmlFor="new-lead"
                                className="text-base font-normal"
                              >
                                {tNotifications("newLeadCaptured")}
                              </Label>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Checkbox id="quote-sent" />
                              <Label
                                htmlFor="quote-sent"
                                className="text-base font-normal"
                              >
                                {tNotifications("quoteSentToCustomer")}
                              </Label>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Checkbox id="customer-responded" />
                              <Label
                                htmlFor="customer-responded"
                                className="text-base font-normal"
                              >
                                {tNotifications("customerRespondedToQuote")}
                              </Label>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Checkbox id="follow-up" />
                              <Label
                                htmlFor="follow-up"
                                className="text-base font-normal"
                              >
                                {tNotifications("followUpReminderTriggered")}
                              </Label>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Checkbox id="campaign-performance" />
                              <Label
                                htmlFor="campaign-performance"
                                className="text-base font-normal"
                              >
                                {tNotifications("campaignPerformanceAlerts")}
                              </Label>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Checkbox id="billing-updates" />
                              <Label
                                htmlFor="billing-updates"
                                className="text-base font-normal"
                              >
                                {tNotifications("billingSubscriptionUpdates")}
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t space-y-6">
                          <div>
                            <h3 className="text-lg font-medium mb-4">
                              {tNotifications("notificationMethods")}
                            </h3>
                          </div>

                          <div className="space-y-5">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-normal">
                                {tNotifications("emailNotifications")}
                              </Label>
                              <Switch />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label className="text-base font-normal">
                                {tNotifications("smsNotifications")}
                              </Label>
                              <Switch />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label className="text-base font-normal">
                                {tNotifications("whatsappNotifications")}
                              </Label>
                              <Switch />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label className="text-base font-normal">
                                {tNotifications("inAppNotifications")}
                              </Label>
                              <Switch />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label className="text-base font-normal">
                                {tNotifications("pushNotificationsFuture")}
                              </Label>
                              <Switch />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab !== "workshops" &&
                    activeTab !== "shop_members" &&
                    activeTab !== "appearance" &&
                    activeTab !== "language" &&
                    activeTab !== "notifications" &&
                    activeTab !== "general" &&
                    activeTab !== "connected_apps" &&
                    activeTab !== "twilio_sendgrid" &&
                    activeTab !== "security" &&
                    activeTab !== "subscription_billing" &&
                    activeTab !== "organizations" && (
                      <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold mb-6">
                          {navItems.find((item) => item.value === activeTab)
                            ?.label || t("comingSoon")}
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
                      key={item.value}
                      onClick={() => handleTabChange(item.value)}
                      className={cn(
                        "flex flex-1 w-full flex-col items-center gap-1 p-2 text-xs text-wrap font-medium transition-colors",
                        activeTab === item.value
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md",
                          activeTab === item.value
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="truncate">{item.label}</span>
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
