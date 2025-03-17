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

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!userId) {
      toast.error(t("error"));
      console.error("ID de usuario inválido para cambiar rol");
      return;
    }

    try {
      if (onUpdateUserRole) {
        await onUpdateUserRole(userId, newRole);
        toast.success(
          newRole === "admin" ? t("adminGranted") : t("adminRemoved")
        );
        router.refresh();
      } else {
        const result = await toggleUserRoleAction(userId);

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

  const handleStatusChange = async (
    userId: string,
    newStatus: "active" | "inactive"
  ) => {
    if (!userId) {
      toast.error(t("error"));
      console.error("ID de usuario inválido para cambiar estado");
      return;
    }

    try {
      const result =
        newStatus === "active"
          ? await activateUserAction(userId)
          : await deactivateUserAction(userId);

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

  const table = useReactTable({
    data: users,
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    meta: {
      onRoleChange: handleRoleChange,
      onActivate: (userId: string) => handleStatusChange(userId, "active"),
      onDeactivate: (userId: string) => handleStatusChange(userId, "inactive"),
    },
  });

  return (
    <div className="space-y-4">
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
                  colSpan={userColumns.length}
                  className="h-24 text-center"
                >
                  {users.length === 0 ? t("noUsers") : t("noResults")}
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
