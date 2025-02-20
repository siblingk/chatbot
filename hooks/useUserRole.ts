import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { AppRole } from "@/types/auth";

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUserRole() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setRole(null);
          return;
        }

        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
          return;
        }

        setRole(userData?.role || null);
      } catch (error) {
        console.error("Error in getUserRole:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    getUserRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUserRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading, isAdmin: role === "admin" };
}
