"use client";
import { Plus, AlertTriangle, Car } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarMenuAction,
} from "@/components/ui/sidebar";

import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// const items = [
//   {
//     title: "Inicio",
//     url: "/",
//     icon: Home,
//   },
// ];

// const adminItems = [
//   {
//     title: "Configuración",
//     url: "/settings",
//     icon: Settings,
//   },
// ];

export function AppSidebar() {
  const { user, isEmailVerified } = useAuth();
  //const { isAdmin } = useUserRole();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Car />
              <span>Siblingk AI</span>
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

        {/* Grupo de navegación principal */}
        {/* <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Mapeo de elementos de navegación principales */}
        {/* {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))} */}
        {/* Mapeo de elementos de administrador si el usuario es admin */}
        {/* {isAdmin &&
                adminItems.map((item) => (
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
        </SidebarGroup> */}
      </SidebarContent>

      {/* Pie de barra lateral que contiene el menú de usuario */}
      {/* <SidebarFooter>
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
                  <DropdownMenuItem>
                    <SignOutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SignInButton />
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter> 
      */}
    </Sidebar>
  );
}
