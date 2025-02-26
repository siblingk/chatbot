"use client";

import { useState, useCallback } from "react";
import { User } from "@/app/actions/users";
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
import { Edit, Trash2, UserPlus, Shield, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { UsersSheet } from "./users-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UsersTableProps {
  users: User[];
  columns: ColumnDef<User>[];
}

export function UsersTable({ users, columns }: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const t = useTranslations("users");

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsSheetOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setTimeout(() => {
      setIsSheetOpen(false);
      setSelectedUser(null);
    }, 0);
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      // Aquí iría la lógica para eliminar el usuario
      toast.success(t("userDeleted"));

      setTimeout(() => {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
      }, 0);
    }
  };

  const handleToggleAdmin = (user: User) => {
    // Aquí iría la lógica para cambiar el rol del usuario
    const newRole = user.role === "admin" ? "user" : "admin";
    console.log(`Cambiando rol de ${user.email} a ${newRole}`);
    toast.success(
      user.role === "admin" ? t("adminRemoved") : t("adminGranted")
    );
  };

  const handleSendEmail = (user: User) => {
    // Aquí iría la lógica para enviar un correo al usuario
    console.log(`Enviando correo a: ${user.email}`);
    toast.success(t("emailSent"));
  };

  // Función para manejar el cambio de estado del diálogo de confirmación
  const handleDeleteDialogChange = useCallback((open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setIsDeleteDialogOpen(false);
        setTimeout(() => {
          setSelectedUser(null);
        }, 100);
      }, 0);
    } else {
      setIsDeleteDialogOpen(true);
    }
  }, []);

  // Añadir columna de rol con badge
  const columnsWithRoleBadge: ColumnDef<User>[] = [
    ...columns.map((col) => {
      // Verificamos si la columna tiene la propiedad id o accessorKey igual a "role"
      const columnId = (col as { accessorKey?: string }).accessorKey || col.id;
      if (columnId === "role") {
        return {
          ...col,
          cell: ({ row }: { row: Row<User> }) => {
            const role = row.getValue("role") as string;
            return (
              <Badge variant={role === "admin" ? "default" : "outline"}>
                {role === "admin" ? t("admin") : t("user")}
              </Badge>
            );
          },
        };
      }
      return col;
    }),
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("openMenu")}</span>
                <Edit className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendEmail(user)}>
                <Mail className="mr-2 h-4 w-4" />
                {t("sendEmail")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                <Shield className="mr-2 h-4 w-4" />
                {user.role === "admin" ? t("removeAdmin") : t("makeAdmin")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(user)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filtrar usuarios basados en el término de búsqueda
  const filteredUsers = users.filter((user) => {
    return (
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const table = useReactTable({
    data: filteredUsers,
    columns: columnsWithRoleBadge,
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
        <Button onClick={handleCreate}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t("inviteUser")}
        </Button>
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
                  colSpan={columnsWithRoleBadge.length}
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

      {/* Sheet para editar/crear usuario */}
      <UsersSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        user={selectedUser}
      />

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteWarning", { email: selectedUser?.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
