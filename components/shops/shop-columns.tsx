/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Shop } from "@/types/shops";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Definición de columnas para la tabla de tiendas
export const createShopColumns = (t: any): ColumnDef<Shop>[] => [
  {
    accessorKey: "name",
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
      const rating = row.getValue("rating") as number;
      // Mostrar estrellas según la calificación
      return (
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-yellow-400">
              {i < rating ? "★" : "☆"}
            </span>
          ))}
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
        <Badge
          variant={value === "active" ? "default" : "destructive"}
          className={value === "active" ? "bg-green-500" : ""}
        >
          {value === "active" ? t("active") : t("inactive")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "rate",
    header: t("rate"),
    cell: ({ row }) => {
      const value = row.getValue("rate") as number;
      // Formatear como moneda
      return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "USD",
      }).format(value);
    },
  },
  {
    accessorKey: "labor_tax_percentage",
    header: t("laborTaxPercentage"),
    cell: ({ row }) => {
      const value = row.getValue("labor_tax_percentage") as number;
      return `${value}%`;
    },
  },
  {
    accessorKey: "parts_tax_percentage",
    header: t("partsTaxPercentage"),
    cell: ({ row }) => {
      const value = row.getValue("parts_tax_percentage") as number;
      return `${value}%`;
    },
  },
  {
    accessorKey: "misc_tax_percentage",
    header: t("miscTaxPercentage"),
    cell: ({ row }) => {
      const value = row.getValue("misc_tax_percentage") as number;
      return `${value}%`;
    },
  },
  {
    accessorKey: "created_at",
    header: t("createdAt"),
    cell: ({ row }) => {
      const value = row.getValue("created_at") as string;
      return value
        ? format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es })
        : "-";
    },
  },
];
