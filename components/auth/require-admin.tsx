import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/auth-context";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        router.push("/");
      } else if (!isAdmin) {
        router.push("/");
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, router]);

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
