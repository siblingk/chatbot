"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User } from "@/app/actions/users";
import { Switch } from "@/components/ui/switch";

// For client components that need to use the columns
export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const value = row.getValue("role") as string;
      return (
        <Badge variant={value === "admin" ? "default" : "secondary"}>
          {value === "admin" ? "Administrador" : "Usuario"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha de creación",
    cell: ({ row }) => {
      const value = row.getValue("created_at") as string;
      return value
        ? format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es })
        : "-";
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row, table }) => {
      const user = row.original;
      const isActive = user.status === "active";

      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={isActive}
            onCheckedChange={() => {
              if (isActive) {
                // @ts-expect-error - El meta está tipado correctamente en tiempo de ejecución
                table.options.meta?.onDeactivate?.(user.id);
              } else {
                // @ts-expect-error - El meta está tipado correctamente en tiempo de ejecución
                table.options.meta?.onActivate?.(user.id);
              }
            }}
          />
          <Badge
            variant={isActive ? "default" : "destructive"}
            className={isActive ? "bg-green-500" : ""}
          >
            {isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Cambiar Rol",
    cell: ({ row, table }) => {
      const user = row.original;
      const isAdmin = user.role === "admin";

      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // @ts-expect-error - El meta está tipado correctamente en tiempo de ejecución
            table.options.meta?.onToggleAdmin?.(user);
          }}
          className={isAdmin ? "text-blue-600" : "text-gray-600"}
        >
          <Shield className="mr-2 h-4 w-4" />
          {isAdmin ? "Quitar Admin" : "Hacer Admin"}
        </Button>
      );
    },
  },
];
