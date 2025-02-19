"use client";

import {
  Home,
  MessageSquare,
  Settings,
  ChevronUp,
  User2,
  Building2,
  Plus,
  LogOut,
  AlertTriangle,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuAction,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SignInButton, SignUpButton } from "@/components/auth/auth-buttons";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const items = [
  {
    title: "Inicio",
    url: "/",
    icon: Home,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Configuración",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { user, isEmailVerified } = useAuth();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Building2 />
              <span>Siblingk</span>
            </SidebarMenuButton>
            <SidebarMenuAction>
              <Plus />
              <span className="sr-only">Agregar acción</span>
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {user && !isEmailVerified && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Por favor, verifica tu correo electrónico para acceder a todas las
              funcionalidades.
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => window.location.reload()}
              >
                Recargar página
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 />
                    <span>{user.email}</span>
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem>
                    <ThemeToggle />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SignInButton />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SignUpButton />
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
