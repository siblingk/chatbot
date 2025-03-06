"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AuthRefresh() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if the refresh parameter is present in the URL
    const shouldRefresh = searchParams.get("refresh") === "true";

    if (shouldRefresh) {
      // Remove the refresh parameter from the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Refresh the page
      router.refresh();
    }
  }, [searchParams, router]);

  // This component doesn't render anything
  return null;
}
