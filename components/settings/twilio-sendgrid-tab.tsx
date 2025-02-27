"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TwilioSendGridConfig } from "@/types/twilio-sendgrid";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface TwilioSendGridTabProps {
  config?: TwilioSendGridConfig;
  onUpdate?: (config: Partial<TwilioSendGridConfig>) => Promise<void>;
}

export function TwilioSendGridTab({
  config,
  onUpdate,
}: TwilioSendGridTabProps) {
  const t = useTranslations("twilioSendgrid");

  // Estado local para manejar los cambios antes de guardarlos
  const [localConfig, setLocalConfig] = useState<TwilioSendGridConfig>(
    config || {
      twilio: {
        enabled: false,
        apiKey: "",
        smsEnabled: false,
        whatsappEnabled: false,
      },
      sendGrid: {
        enabled: false,
        apiKey: "",
      },
      leadNotificationPreferences: {
        sms: false,
        email: false,
        both: false,
      },
    }
  );

  // Estado para manejar el tipo de notificación seleccionado
  const [notificationType, setNotificationType] = useState<string>(() => {
    if (localConfig.leadNotificationPreferences.both) return "both";
    if (localConfig.leadNotificationPreferences.sms) return "sms";
    if (localConfig.leadNotificationPreferences.email) return "email";
    return "";
  });

  // Función para actualizar el estado local
  const handleToggle = (path: string, value: boolean) => {
    const newConfig = { ...localConfig };

    // Actualizar el valor en la ruta especificada
    const parts = path.split(".");
    let current: Record<string, unknown> = newConfig;

    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;

    setLocalConfig(newConfig);

    // Si hay una función onUpdate, llamarla con los cambios
    if (onUpdate) {
      onUpdate(newConfig);
    }
  };

  // Función para actualizar los valores de texto
  const handleTextChange = (path: string, value: string) => {
    const newConfig = { ...localConfig };

    // Actualizar el valor en la ruta especificada
    const parts = path.split(".");
    let current: Record<string, unknown> = newConfig;

    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;

    setLocalConfig(newConfig);
  };

  // Función para manejar el cambio en las preferencias de notificación
  const handleNotificationPreferenceChange = (value: string) => {
    setNotificationType(value);

    const newPreferences = {
      sms: value === "sms",
      email: value === "email",
      both: value === "both",
    };

    const newConfig = {
      ...localConfig,
      leadNotificationPreferences: newPreferences,
    };

    setLocalConfig(newConfig);

    // Si hay una función onUpdate, llamarla con los cambios
    if (onUpdate) {
      onUpdate(newConfig);
    }
  };

  return (
    <div className="space-y-8">
      {/* Twilio SMS & WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle>{t("twilioSmsWhatsapp")}</CardTitle>
          <CardDescription>{t("twilioDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="twilio-api-key">{t("twilioApiKey")}</Label>
              <Input
                id="twilio-api-key"
                placeholder={t("enterTwilioApiKey")}
                value={localConfig.twilio.apiKey}
                onChange={(e) =>
                  handleTextChange("twilio.apiKey", e.target.value)
                }
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <span>{t("enableTwilioSms")}</span>
              <Switch
                checked={localConfig.twilio.smsEnabled}
                onCheckedChange={(checked) =>
                  handleToggle("twilio.smsEnabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span>{t("enableWhatsappMessaging")}</span>
              <Switch
                checked={localConfig.twilio.whatsappEnabled}
                onCheckedChange={(checked) =>
                  handleToggle("twilio.whatsappEnabled", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SendGrid Email Automations */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sendgridEmailAutomations")}</CardTitle>
          <CardDescription>{t("sendgridDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="sendgrid-api-key">{t("sendgridApiKey")}</Label>
              <Input
                id="sendgrid-api-key"
                placeholder={t("enterSendgridApiKey")}
                value={localConfig.sendGrid.apiKey}
                onChange={(e) =>
                  handleTextChange("sendGrid.apiKey", e.target.value)
                }
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <span>{t("enableAutomatedEmails")}</span>
              <Switch
                checked={localConfig.sendGrid.enabled}
                onCheckedChange={(checked) =>
                  handleToggle("sendGrid.enabled", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>{t("leadNotificationPreferences")}</CardTitle>
          <CardDescription>
            {t("chooseHowToReceiveLeadNotifications")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={notificationType}
            onValueChange={handleNotificationPreferenceChange}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="sms" id="sms-option" />
              <Label htmlFor="sms-option">{t("receiveViaSms")}</Label>
            </div>

            <div className="flex items-center space-x-3">
              <RadioGroupItem value="email" id="email-option" />
              <Label htmlFor="email-option">{t("receiveViaEmail")}</Label>
            </div>

            <div className="flex items-center space-x-3">
              <RadioGroupItem value="both" id="both-option" />
              <Label htmlFor="both-option">{t("receiveBothSmsEmail")}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
