"use client";

import { useState, useTransition } from "react";
import { signIn } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { GoogleSignInButton } from "@/components/auth/auth-buttons";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  const t = useTranslations("auth");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    // Usar useTransition para evitar que la UI se bloquee
    startTransition(async () => {
      try {
        const result = await signIn(formData);

        if (result.error) {
          setError(result.error);
          return;
        }

        // Redireccionar al usuario a la página principal después de iniciar sesión
        router.push("/");
        router.refresh();
      } catch {
        setError(t("signInError"));
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">{t("signInTitle")}</h2>
          <p className="mt-2 text-sm">{t("signInSubtitle")}</p>
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
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={isPending}
          >
            <LogIn className="h-4 w-4" />
            {isPending ? t("signInLoading") : t("signInButton")}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm">
              {t("noAccount")}{" "}
              <Link href="/auth/signup" className="font-medium hover:underline">
                {t("registerHere")}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
