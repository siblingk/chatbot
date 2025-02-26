"use client";

import { User } from "@/app/actions/users";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { UserForm } from "./user-form";

interface UsersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

export function UsersSheet({ isOpen, onClose, user }: UsersSheetProps) {
  const t = useTranslations("users");

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
          <SheetTitle>{user ? t("editUser") : t("inviteUser")}</SheetTitle>
          <SheetDescription>
            {user ? t("editUserDesc") : t("inviteUserDesc")}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <UserForm user={user} onClose={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
