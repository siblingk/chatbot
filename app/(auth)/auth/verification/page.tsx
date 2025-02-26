"use client";

import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function VerificationPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <h2 className="mt-6 text-3xl font-bold">{t("verificationTitle")}</h2>

        <p className="mt-2">{t("verificationMessage")}</p>

        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            {t("checkSpam", {
              defaultValue:
                "If you haven't received the email, check your spam folder or request a new link.",
            })}
          </p>
        </div>

        <div className="mt-8">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/auth/signin">
              <ArrowLeft className="h-4 w-4" />
              {t("backToSignIn", {
                defaultValue: "Back to sign in",
              })}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
