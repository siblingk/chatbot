"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function AuthRefresh() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Check if the refresh parameter is present in the URL
    const shouldRefresh = searchParams.get("refresh") === "true";

    if (shouldRefresh) {
      // Remove the refresh parameter from the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Usar useTransition para evitar que la UI se bloquee
      startTransition(() => {
        // Refresh the page to update the auth state
        router.refresh();
      });
    }
  }, [searchParams, router]);

  // Forzar una actualización cuando el usuario cambia
  useEffect(() => {
    if (user) {
      // Si el usuario está autenticado, asegurarse de que la UI se actualice
      startTransition(() => {
        router.refresh();
      });
    }
  }, [user, router]);

  // This component doesn't render anything
  return null;
}
