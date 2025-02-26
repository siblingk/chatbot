"use client";
import { signOut } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export function SignOutButton() {
  const t = useTranslations("auth");

  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex text-sm items-center gap-2 px-2.5 py-1.5"
      >
        <LogOut className="h-4 w-4" />
        {t("signOut")}
      </button>
    </form>
  );
}
