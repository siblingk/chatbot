"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Search,
  Store,
  LayoutGrid,
  Brain,
  BarChart2,
} from "lucide-react";
import { ChatDashboardOption } from "@/types/chat";
import { getChatDashboardOptions } from "@/app/actions/chat-dashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/auth-context";

interface ChatDashboardOptionsProps {
  onOptionSelected: (responseText: string, buttonText: string) => void;
}

// Mapeo de nombres de iconos a componentes
const iconMap: Record<string, React.ReactNode> = {
  BarChart: <BarChart className="h-5 w-5" />,
  Store: <Store className="h-5 w-5" />,
  Search: <Search className="h-5 w-5" />,
  LayoutGrid: <LayoutGrid className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
  BarChart2: <BarChart2 className="h-5 w-5" />,
};

export function ChatDashboardOptions({
  onOptionSelected,
}: ChatDashboardOptionsProps) {
  // Declarar estados
  const [options, setOptions] = useState<ChatDashboardOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener información de autenticación y rol
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Variable para verificar si es super admin
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    // No cargar opciones si el usuario no está autenticado o es general_lead
    if (authLoading || roleLoading || !user || role === "general_lead") {
      setIsLoading(false);
      return;
    }

    async function loadOptions() {
      try {
        const dashboardOptions = await getChatDashboardOptions();
        setOptions(dashboardOptions);
      } catch (error) {
        console.error("Error al cargar opciones del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOptions();

    return () => {
      // Limpiar recursos si es necesario
    };
  }, [user, role, authLoading, roleLoading]);

  const handleOptionClick = (option: ChatDashboardOption) => {
    onOptionSelected("", option.button_text);
  };

  // Cancelar renderizado temprano si no se cumplen las condiciones
  if (authLoading || roleLoading) {
    // Todavía están cargando, no mostrar nada
    return null;
  }

  if (!user || role === "general_lead") {
    // Usuario no autenticado o es general_lead, no mostrar nada
    console.log("ChatDashboardOptions no se renderiza:", {
      user: !!user,
      role,
    });
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-1">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-16 bg-muted/10 rounded-xl"
          ></div>
        ))}
      </div>
    );
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5",
        isSuperAdmin ? "p-0" : "px-0.5 py-1"
      )}
    >
      {options.map((option) => (
        <Button
          key={option.id}
          variant={isSuperAdmin ? "outline" : "ghost"}
          className={cn(
            "flex items-center justify-start h-11 w-full px-3 py-2 rounded-md",
            "bg-background/70 hover:bg-primary/5 transition-all duration-150 ease-in-out",
            "focus:outline-none focus:ring-1 focus:ring-primary/20",
            isSuperAdmin
              ? "border-primary/20 hover:border-primary/40 shadow-sm"
              : "border border-border/30 hover:border-border/70 shadow-sm"
          )}
          onClick={() => handleOptionClick(option)}
        >
          <span
            className={cn(
              "flex items-center justify-center rounded-md mr-3",
              isSuperAdmin ? "text-primary" : "text-foreground/70"
            )}
          >
            {iconMap[option.icon_name] || <BarChart className="h-4 w-4" />}
          </span>
          <span
            className={cn(
              "text-sm font-medium text-left truncate",
              isSuperAdmin
                ? "font-medium text-foreground"
                : "text-foreground/90"
            )}
          >
            {option.button_text}
          </span>
        </Button>
      ))}
    </div>
  );
}
