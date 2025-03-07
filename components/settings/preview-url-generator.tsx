"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Agent } from "@/types/agents";

interface PreviewUrlGeneratorProps {
  agentId?: string;
  agentConfig?: Agent | Record<string, unknown>;
}

export function PreviewUrlGenerator({
  agentId,
  agentConfig,
}: PreviewUrlGeneratorProps) {
  const t = useTranslations("settings");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Generar la URL con parámetros del agente utilizando los parámetros definidos
  const generatePreviewUrl = () => {
    // Generar un session_id único
    const timestamp = Date.now();
    const randomValue = Math.floor(Math.random() * 1000000);
    const sessionId = `${timestamp}-${randomValue}`;

    // Apuntar a la página principal en lugar de a una página de preview separada
    const baseUrl = `${window.location.origin}/chat/${sessionId}`;
    const params = new URLSearchParams();

    // Solo usar el agentId como parámetro
    if (agentId) {
      params.set("agentId", agentId);
    } else if (agentConfig && agentConfig.id) {
      // Si no hay agentId pero hay un id en el agentConfig, usarlo
      params.set("agentId", String(agentConfig.id));
    }

    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    setPreviewUrl(url);
  };

  // Copiar la URL al portapapeles
  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{t("previewUrlWithConfig")}</CardTitle>
        <CardDescription>{t("previewUrlDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generatePreviewUrl}
          variant="outline"
          className="w-full"
        >
          {t("generateChatUrl")}
        </Button>

        {previewUrl && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input value={previewUrl} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title={t("copyUrl")}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                title={t("openInNewTab")}
              >
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-green-600">{t("urlCopied")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
