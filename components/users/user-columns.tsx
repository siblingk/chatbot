"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User } from "@/app/actions/users";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// For client components that need to use the columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createUserColumns = (t: any): ColumnDef<User>[] => [
  {
    accessorKey: "email",
    header: t("email"),
  },
  {
    accessorKey: "role",
    header: t("role"),
    cell: ({ row, table }) => {
      const user = row.original;
      const value = row.getValue("role") as string;

      return (
        <div className="flex items-center space-x-2">
          <Select
            defaultValue={value}
            onValueChange={(newRole) => {
              // @ts-expect-error - El meta está tipado correctamente en tiempo de ejecución
              table.options.meta?.onRoleChange?.(user.id, newRole);
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder={t("selectRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">{t("admin")}</SelectItem>
              <SelectItem value="user">{t("user")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
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
  {
    accessorKey: "status",
    header: t("status"),
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
            {isActive ? t("active") : t("inactive")}
          </Badge>
        </div>
      );
    },
  },
];
