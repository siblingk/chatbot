"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Setting } from "@/types/settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export const columns: ColumnDef<Setting>[] = [
  {
    accessorKey: "workshop_id",
    header: "ID del Taller",
  },
  {
    accessorKey: "workshop_name",
    header: "Nombre",
  },
  {
    accessorKey: "interaction_tone",
    header: "Tono de Interacción",
  },
  {
    accessorKey: "lead_assignment_mode",
    header: "Asignación de Leads",
    cell: ({ row }) => {
      const value = row.getValue("lead_assignment_mode") as string;
      return (
        <Badge variant={value === "automatic" ? "default" : "secondary"}>
          {value === "automatic" ? "Automático" : "Manual"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "price_source",
    header: "Fuente de Precios",
    cell: ({ row }) => {
      const value = row.getValue("price_source") as string;
      return (
        <Badge variant={value === "ai" ? "default" : "secondary"}>
          {value === "ai" ? "AI" : "API Dcitelly"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const setting = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              // @ts-expect-error asd
              onClick={() => table.options.meta?.onEdit(setting)}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              // @ts-expect-error asd
              onClick={() => table.options.meta?.onDelete(setting.id)}
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
