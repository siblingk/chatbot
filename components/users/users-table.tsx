"use client";

import { useState } from "react";
import {
  User,
  // activateUserAction,
  // deactivateUserAction,
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
import { createUserColumns } from "./user-columns";

interface UsersTableProps {
  users: User[];
  columns?: ColumnDef<User>[];
  onUpdateUserRole?: (userId: string, role: string) => Promise<void>;
  onRemoveUser?: (userId: string) => Promise<void>;
}

export function UsersTable({
  users,
  columns = [],
  onUpdateUserRole,
  onRemoveUser,
}: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const t = useTranslations("users");
  const router = useRouter();

  // Usar las columnas proporcionadas o crear nuevas con las traducciones
  const userColumns = columns.length > 0 ? columns : createUserColumns(t);

  const handleRoleChange = async (user: User, newRole: string) => {
    if (!user || !user.id) {
      toast.error(t("error"));
      console.error("ID de usuario inválido para cambiar rol:", user);
      return;
    }

    // Solo hacemos el cambio si el rol es diferente al actual
    if (user.role === newRole) return;

    try {
      if (onUpdateUserRole) {
        await onUpdateUserRole(user.id, newRole);
        toast.success(
          newRole === "admin" ? t("adminGranted") : t("adminRemoved")
        );
        router.refresh();
      } else {
        const result = await toggleUserRoleAction(user.id);

        if (result.message && !result.message.includes("Error")) {
          toast.success(
            newRole === "admin" ? t("adminGranted") : t("adminRemoved")
          );
          router.refresh();
        } else {
          toast.error(result.message || t("error"));
        }
      }
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      toast.error(t("error"));
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!userId) {
      toast.error(t("error"));
      console.error("ID de usuario inválido para eliminar");
      return;
    }

    try {
      if (onRemoveUser) {
        await onRemoveUser(userId);
        toast.success(t("userRemoved"));
        router.refresh();
      } else {
        // Implementación por defecto si no se proporciona onRemoveUser
        toast.error(t("removeNotImplemented"));
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast.error(t("error"));
    }
  };

  // Modificamos las columnas para incluir selects para estado y rol
  const tableColumns = [
    ...userColumns,
    {
      id: "actions",
      cell: ({ row }: { row: Row<User> }) => {
        const user = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Select
              value={user.role}
              onValueChange={(value) => handleRoleChange(user, value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={t("selectRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t("user")}</SelectItem>
                <SelectItem value="admin">{t("admin")}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemoveUser(user.id)}
              className="ml-2"
            >
              {t("remove")}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <h2 className="text-xl font-semibold">{t("usersList")}</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("addUser")}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t("addUser")}</SheetTitle>
              <SheetDescription>{t("addUserDescription")}</SheetDescription>
            </SheetHeader>
            <UserForm />
          </SheetContent>
        </Sheet>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
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
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  {t("noUsers")}
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
