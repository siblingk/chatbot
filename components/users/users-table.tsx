"use client";

import { useState } from "react";
import {
  User,
  activateUserAction,
  deactivateUserAction,
  toggleUserRoleAction,
} from "@/app/actions/users";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  Row,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserForm } from "./user-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface UsersTableProps {
  users: User[];
  columns: ColumnDef<User>[];
}

export function UsersTable({ users, columns }: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const t = useTranslations("users");
  const router = useRouter();

  const handleStatusChange = async (
    user: User,
    newStatus: "active" | "inactive"
  ) => {
    if (!user || !user.id) {
      toast.error(t("error"));
      console.error("ID de usuario inválido para cambiar estado:", user);
      return;
    }

    try {
      const result =
        newStatus === "active"
          ? await activateUserAction(user.id)
          : await deactivateUserAction(user.id);

      if (result.message && !result.message.includes("Error")) {
        toast.success(
          newStatus === "active" ? t("userActivated") : t("userDeactivated")
        );
        router.refresh();
      } else {
        toast.error(result.message || t("error"));
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error(t("error"));
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    if (!user || !user.id) {
      toast.error(t("error"));
      console.error("ID de usuario inválido para cambiar rol:", user);
      return;
    }

    // Solo hacemos el cambio si el rol es diferente al actual
    if (user.role === newRole) return;

    try {
      const result = await toggleUserRoleAction(user.id);

      if (result.message && !result.message.includes("Error")) {
        toast.success(
          newRole === "admin" ? t("adminGranted") : t("adminRemoved")
        );
        router.refresh();
      } else {
        toast.error(result.message || t("error"));
      }
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      toast.error(t("error"));
    }
  };

  // Modificamos las columnas para incluir selects para estado y rol
  const enhancedColumns: ColumnDef<User>[] = [
    ...columns.map((col) => {
      const columnId = (col as { accessorKey?: string }).accessorKey || col.id;

      // Modificamos la columna de rol para mostrar un select
      if (columnId === "role") {
        return {
          ...col,
          cell: ({ row }: { row: Row<User> }) => {
            const user = row.original;
            return (
              <Select
                defaultValue={user.role}
                onValueChange={(value) => handleRoleChange(user, value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("admin")}</SelectItem>
                  <SelectItem value="user">{t("user")}</SelectItem>
                </SelectContent>
              </Select>
            );
          },
        };
      }

      // Modificamos la columna de estado para mostrar un select
      if (columnId === "status") {
        return {
          ...col,
          cell: ({ row }: { row: Row<User> }) => {
            const user = row.original;
            return (
              <Select
                defaultValue={user.status}
                onValueChange={(value: "active" | "inactive") =>
                  handleStatusChange(user, value)
                }
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="inactive">{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
            );
          },
        };
      }

      return col;
    }),
  ];

  const filteredData = users.filter((user) => {
    if (!searchTerm) return true;
    return (
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.status &&
        user.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const table = useReactTable({
    data: filteredData,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder={t("searchUsers")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("inviteUser")}
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("inviteUser")}</SheetTitle>
              <SheetDescription>{t("inviteUserDesc")}</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <UserForm user={null} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={enhancedColumns.length}
                  className="h-24 text-center"
                >
                  {users.length === 0 ? t("noData") : t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
