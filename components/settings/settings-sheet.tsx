"use client";

import { Setting } from "@/types/settings";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SettingsForm } from "./settings-form";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  setting?: Setting | null;
}

export function SettingsSheet({
  isOpen,
  onClose,
  setting,
}: SettingsSheetProps) {
  const t = useTranslations("settings");

  // Función simple para manejar el cierre del Sheet
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Usamos setTimeout para evitar actualizaciones anidadas
        setTimeout(() => {
          onClose();
        }, 0);
      }
    },
    [onClose]
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {setting ? t("editWorkshop") : t("createWorkshop")}
          </SheetTitle>
          <SheetDescription>
            {setting ? t("editWorkshopDesc") : t("createWorkshopDesc")}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <SettingsForm setting={setting} onClose={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
