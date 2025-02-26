"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (formData: FormData) => {
    setError("");
    setLoading(true);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate that passwords match
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Redirect to verification page
      router.push("/auth/verification");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(t("signUpError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">{t("signUpTitle")}</h2>
          <p className="mt-2 text-sm">{t("signUpSubtitle")}</p>
        </div>

        <form action={handleSignUp} className="mt-8 space-y-6">
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
            disabled={loading}
          >
            <UserPlus className="h-4 w-4" />
            {loading ? t("signUpLoading") : t("signUpButton")}
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
