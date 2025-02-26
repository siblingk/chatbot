"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Check, Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export function LanguageSelector() {
  const t = useTranslations("language");
  const [isPending, startTransition] = useTransition();
  const { locale, setLocale } = useLanguage();

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      setLocale(newLocale);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t("title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={isPending || locale === "en"}
          onClick={() => handleLocaleChange("en")}
          className="flex items-center justify-between"
        >
          <span>{t("en")}</span>
          {locale === "en" && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isPending || locale === "es"}
          onClick={() => handleLocaleChange("es")}
          className="flex items-center justify-between"
        >
          <span>{t("es")}</span>
          {locale === "es" && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
