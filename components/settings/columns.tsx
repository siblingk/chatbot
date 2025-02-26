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

// For client components that need to use the columns
export const columns: ColumnDef<Setting>[] = [
  {
    accessorKey: "workshop_id",
    header: "Workshop ID",
  },
  {
    accessorKey: "workshop_name",
    header: "Name",
  },
  {
    accessorKey: "interaction_tone",
    header: "Interaction Tone",
  },
  {
    accessorKey: "lead_assignment_mode",
    header: "Lead Assignment",
    cell: ({ row }) => {
      const value = row.getValue("lead_assignment_mode") as string;
      return (
        <Badge variant={value === "automatic" ? "default" : "secondary"}>
          {value === "automatic" ? "Automatic" : "Manual"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "price_source",
    header: "Price Source",
    cell: ({ row }) => {
      const value = row.getValue("price_source") as string;
      return (
        <Badge variant={value === "ai" ? "default" : "secondary"}>
          {value === "ai" ? "AI" : "Dcitelly API"}
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
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              // @ts-expect-error asd
              onClick={() => table.options.meta?.onEdit(setting)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              // @ts-expect-error asd
              onClick={() => table.options.meta?.onDelete(setting.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
