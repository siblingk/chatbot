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
import { MoreHorizontal, Star, StarHalf } from "lucide-react";
import { format } from "date-fns";

// For client components that need to use the columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createSettingsColumns = (t: any): ColumnDef<Setting>[] => [
  {
    accessorKey: "workshop_id",
    header: t("workshopId"),
  },
  {
    accessorKey: "workshop_name",
    header: t("name"),
  },
  {
    accessorKey: "location",
    header: t("location"),
  },
  {
    accessorKey: "rating",
    header: t("rating"),
    cell: ({ row }) => {
      const rating = parseFloat(row.getValue("rating") as string) || 0;
      return (
        <div className="flex items-center">
          {[...Array(Math.floor(rating))].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
          ))}
          {rating % 1 > 0 && (
            <StarHalf className="h-4 w-4 fill-primary text-primary" />
          )}
          <span className="ml-2">{rating}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: t("status"),
    cell: ({ row }) => {
      const value = row.getValue("status") as string;
      return (
        <Badge variant={value === "active" ? "default" : "secondary"}>
          {value === "active" ? t("active") : t("inactive")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "rate",
    header: t("rate"),
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue("rate") as string) || 0;
      return <span>${rate.toFixed(2)}/hr</span>;
    },
  },
  {
    accessorKey: "interaction_tone",
    header: t("interactionTone"),
  },
  {
    accessorKey: "lead_assignment_mode",
    header: t("leadAssignmentMode"),
    cell: ({ row }) => {
      const value = row.getValue("lead_assignment_mode") as string;
      return (
        <Badge variant={value === "automatic" ? "default" : "secondary"}>
          {value === "automatic" ? t("automatic") : t("manual")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "price_source",
    header: t("priceSource"),
    cell: ({ row }) => {
      const value = row.getValue("price_source") as string;
      return (
        <Badge variant={value === "ai" ? "default" : "secondary"}>
          {value === "ai" ? t("ai") : t("dcitellyApi")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "labor_tax_percentage",
    header: t("laborTaxPercentage"),
    cell: ({ row }) => {
      const tax =
        parseFloat(row.getValue("labor_tax_percentage") as string) || 0;
      return <span>{tax}%</span>;
    },
  },
  {
    accessorKey: "parts_tax_percentage",
    header: t("partsTaxPercentage"),
    cell: ({ row }) => {
      const tax =
        parseFloat(row.getValue("parts_tax_percentage") as string) || 0;
      return <span>{tax}%</span>;
    },
  },
  {
    accessorKey: "misc_tax_percentage",
    header: t("miscTaxPercentage"),
    cell: ({ row }) => {
      const tax =
        parseFloat(row.getValue("misc_tax_percentage") as string) || 0;
      return <span>{tax}%</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: t("createdAt"),
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      if (!date) return null;
      return <span>{format(new Date(date), "PPP")}</span>;
    },
  },
  {
    id: "actions",
    header: t("actions"),
    cell: ({ row, table }) => {
      const setting = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t("openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
            <DropdownMenuItem
              // @ts-expect-error asd
              onClick={() => table.options.meta?.onEdit(setting)}
            >
              {t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              // @ts-expect-error asd
              onClick={() => table.options.meta?.onDelete(setting.id)}
            >
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
