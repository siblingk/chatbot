"use client";
import { signOut } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export function SignOutButton() {
  const t = useTranslations("auth");

  return (
    <form action={signOut}>
      <button type="submit" className="flex items-center gap-2 p-2">
        <LogOut className="h-4 w-4" />
        {t("signOut")}
      </button>
    </form>
  );
}
