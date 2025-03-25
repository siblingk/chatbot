"use client";

import { useEffect, useState } from "react";
import { getUserRole } from "@/app/actions/auth";
import { AppRole } from "@/types/auth";

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserRole() {
      try {
        const { role: userRole } = await getUserRole();

        if (isMounted) {
          console.log("useUserRole - Role obtenido:", userRole);
          setRole(userRole);
        }
      } catch (error) {
        console.error("Error in useUserRole:", error);
        if (isMounted) {
          setRole(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchUserRole();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    role,
    loading,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin",
    isColaborador: role === "colaborador",
    isUser: role === "user",
    isShop: role === "shop",
    isGeneralLead: role === "general_lead",
  };
}
