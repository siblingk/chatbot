"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ConnectedAppsConfig } from "@/types/connected-apps";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Facebook, Instagram, Linkedin, Music2 } from "lucide-react";

interface ConnectedAppsTabProps {
  config?: ConnectedAppsConfig;
  onUpdate?: (config: Partial<ConnectedAppsConfig>) => Promise<void>;
}

export function ConnectedAppsTab({ config, onUpdate }: ConnectedAppsTabProps) {
  const t = useTranslations("connectedApps");

  // Estado local para manejar los cambios antes de guardarlos
  const [localConfig, setLocalConfig] = useState<ConnectedAppsConfig>(
    config || {
      metaAds: {
        enabled: false,
        accountConnected: false,
      },
      googleAds: {
        enabled: false,
        accountConnected: false,
      },
      socialMediaAutoPosting: {
        enabled: false,
        platforms: {
          facebook: false,
          instagram: false,
          tiktok: false,
          linkedin: false,
        },
      },
      dcitelly: {
        enabled: false,
        accountConnected: false,
        autoSync: {
          invoices: false,
          repairOrders: false,
        },
      },
    }
  );

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

  return (
    <div className="space-y-8">
      {/* Meta Ads Integration */}
      <Card>
        <CardHeader>
          <CardTitle>{t("metaAdsIntegration")}</CardTitle>
          <CardDescription>{t("metaAdsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>{t("enableMetaAds")}</span>
            <Switch
              checked={localConfig.metaAds.enabled}
              onCheckedChange={(checked) =>
                handleToggle("metaAds.enabled", checked)
              }
            />
          </div>
          <Button
            variant="outline"
            disabled={!localConfig.metaAds.enabled}
            className="w-full sm:w-auto"
          >
            {localConfig.metaAds.accountConnected
              ? t("reconnectMetaAdsAccount")
              : t("connectMetaAdsAccount")}
          </Button>
        </CardContent>
      </Card>

      {/* Google Ads Integration */}
      <Card>
        <CardHeader>
          <CardTitle>{t("googleAdsIntegration")}</CardTitle>
          <CardDescription>{t("googleAdsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>{t("enableGoogleAds")}</span>
            <Switch
              checked={localConfig.googleAds.enabled}
              onCheckedChange={(checked) =>
                handleToggle("googleAds.enabled", checked)
              }
            />
          </div>
          <Button
            variant="outline"
            disabled={!localConfig.googleAds.enabled}
            className="w-full sm:w-auto"
          >
            {localConfig.googleAds.accountConnected
              ? t("reconnectGoogleAdsAccount")
              : t("connectGoogleAdsAccount")}
          </Button>
        </CardContent>
      </Card>

      {/* Social Media Auto-Posting */}
      <Card>
        <CardHeader>
          <CardTitle>{t("socialMediaAutoPosting")}</CardTitle>
          <CardDescription>{t("socialMediaDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>{t("enableSocialMediaAutoPosting")}</span>
            <Switch
              checked={localConfig.socialMediaAutoPosting.enabled}
              onCheckedChange={(checked) =>
                handleToggle("socialMediaAutoPosting.enabled", checked)
              }
            />
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Facebook className="h-5 w-5 text-blue-600" />
                <span>Facebook</span>
              </div>
              <Switch
                checked={localConfig.socialMediaAutoPosting.platforms.facebook}
                onCheckedChange={(checked) =>
                  handleToggle(
                    "socialMediaAutoPosting.platforms.facebook",
                    checked
                  )
                }
                disabled={!localConfig.socialMediaAutoPosting.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-pink-600" />
                <span>Instagram</span>
              </div>
              <Switch
                checked={localConfig.socialMediaAutoPosting.platforms.instagram}
                onCheckedChange={(checked) =>
                  handleToggle(
                    "socialMediaAutoPosting.platforms.instagram",
                    checked
                  )
                }
                disabled={!localConfig.socialMediaAutoPosting.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5" />
                <span>TikTok</span>
              </div>
              <Switch
                checked={localConfig.socialMediaAutoPosting.platforms.tiktok}
                onCheckedChange={(checked) =>
                  handleToggle(
                    "socialMediaAutoPosting.platforms.tiktok",
                    checked
                  )
                }
                disabled={!localConfig.socialMediaAutoPosting.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-blue-700" />
                <span>LinkedIn</span>
              </div>
              <Switch
                checked={localConfig.socialMediaAutoPosting.platforms.linkedin}
                onCheckedChange={(checked) =>
                  handleToggle(
                    "socialMediaAutoPosting.platforms.linkedin",
                    checked
                  )
                }
                disabled={!localConfig.socialMediaAutoPosting.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dcitelly Integration */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dcitellyIntegration")}</CardTitle>
          <CardDescription>{t("dcitellyDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>{t("enableDcitellySync")}</span>
            <Switch
              checked={localConfig.dcitelly.enabled}
              onCheckedChange={(checked) =>
                handleToggle("dcitelly.enabled", checked)
              }
            />
          </div>

          <Button
            variant="outline"
            disabled={!localConfig.dcitelly.enabled}
            className="w-full sm:w-auto"
          >
            {localConfig.dcitelly.accountConnected
              ? t("reconnectDcitellyAccount")
              : t("connectDcitellyAccount")}
          </Button>

          <Separator className="my-4" />

          <h3 className="text-sm font-medium mb-2">{t("autoSyncSettings")}</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>{t("invoices")}</span>
              <Switch
                checked={localConfig.dcitelly.autoSync.invoices}
                onCheckedChange={(checked) =>
                  handleToggle("dcitelly.autoSync.invoices", checked)
                }
                disabled={
                  !localConfig.dcitelly.enabled ||
                  !localConfig.dcitelly.accountConnected
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span>{t("repairOrders")}</span>
              <Switch
                checked={localConfig.dcitelly.autoSync.repairOrders}
                onCheckedChange={(checked) =>
                  handleToggle("dcitelly.autoSync.repairOrders", checked)
                }
                disabled={
                  !localConfig.dcitelly.enabled ||
                  !localConfig.dcitelly.accountConnected
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
