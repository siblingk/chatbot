"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isEmailVerified: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isEmailVerified: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Obtener el usuario autenticado de forma segura
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      setIsEmailVerified(user?.email_confirmed_at != null);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Cuando cambia el estado de autenticación, verificar el usuario con getUser()
      if (session) {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
        setIsEmailVerified(data.user?.email_confirmed_at != null);
      } else {
        setUser(null);
        setIsEmailVerified(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
