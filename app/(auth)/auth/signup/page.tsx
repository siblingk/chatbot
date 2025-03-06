"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { GoogleSignInButton } from "@/components/auth/auth-buttons";
import { Separator } from "@/components/ui/separator";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    // Usar useTransition para evitar que la UI se bloquee
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || t("signUpError"));
          return;
        }

        setSuccess(true);
      } catch {
        setError(t("signUpError"));
      }
    });
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <h2 className="mt-6 text-3xl font-bold">{t("verificationTitle")}</h2>
          <p className="mt-2">{t("verificationMessage")}</p>
          <p className="mt-2 text-sm">{t("checkSpam")}</p>
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="font-medium hover:underline text-primary"
            >
              {t("backToSignIn")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">{t("signUpTitle")}</h2>
          <p className="mt-2 text-sm">{t("signUpSubtitle")}</p>
        </div>

        <GoogleSignInButton className="mt-4" />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                {t("email")}
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder={t("emailPlaceholder")}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                {t("password")}
              </label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder={t("passwordPlaceholder")}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium"
              >
                {t("confirmPassword")}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder={t("confirmPasswordPlaceholder")}
                required
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={isPending}
          >
            <UserPlus className="h-4 w-4" />
            {isPending ? t("signUpLoading") : t("signUpButton")}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm">
              {t("haveAccount")}{" "}
              <Link href="/auth/signin" className="font-medium hover:underline">
                {t("signInHere")}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
