"use client";

import { useEffect, useState } from "react";
import { getUserRole } from "@/app/actions/auth";
import { AppRole } from "@/types/auth";

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  console.log(role);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { role: userRole } = await getUserRole();
        setRole(userRole);
      } catch (error) {
        console.error("Error in useUserRole:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return {
    role,
    loading,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin",
    isColaborador: role === "colaborador",
    isUser: role === "user",
    isShop: role === "shop",
  };
}
