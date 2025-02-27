"use client";

import { useState } from "react";
import {
  activateShopAction,
  deactivateShopAction,
  deleteShopAction,
} from "@/app/actions/shops";
import { Shop } from "@/types/shops";
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
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { ShopForm } from "./shop-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createShopColumns } from "./shop-columns";

interface ShopsTableProps {
  shops: Shop[];
  columns?: ColumnDef<Shop>[];
}

export function ShopsTable({ shops, columns = [] }: ShopsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);

  const t = useTranslations("shops");
  const router = useRouter();

  // Usar las columnas proporcionadas o crear nuevas con las traducciones
  const shopColumns = columns.length > 0 ? columns : createShopColumns(t);

  const handleStatusChange = async (
    shop: Shop,
    newStatus: "active" | "inactive"
  ) => {
    if (!shop || !shop.id) {
      toast.error(t("error"));
      console.error("ID de tienda inválido para cambiar estado:", shop);
      return;
    }

    try {
      const result =
        newStatus === "active"
          ? await activateShopAction(shop.id)
          : await deactivateShopAction(shop.id);

      if (result.message && !result.message.includes("Error")) {
        toast.success(
          newStatus === "active" ? t("shopActivated") : t("shopDeactivated")
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

  const handleDeleteShop = async () => {
    if (!shopToDelete || !shopToDelete.id) {
      toast.error(t("error"));
      console.error("ID de tienda inválido para eliminar:", shopToDelete);
      return;
    }

    try {
      const result = await deleteShopAction(shopToDelete.id);

      if (result.message && !result.message.includes("Error")) {
        toast.success(t("deleteSuccess"));
        router.refresh();
      } else {
        toast.error(result.message || t("error"));
      }
    } catch (error) {
      console.error("Error al eliminar tienda:", error);
      toast.error(t("error"));
    } finally {
      setShopToDelete(null);
    }
  };

  // Modificamos las columnas para incluir selects para estado y acciones
  const enhancedColumns: ColumnDef<Shop>[] = [
    ...shopColumns.map((col) => {
      const columnId = (col as { accessorKey?: string }).accessorKey || col.id;

      // Modificamos la columna de estado para mostrar un select
      if (columnId === "status") {
        return {
          ...col,
          cell: ({ row }: { row: Row<Shop> }) => {
            const shop = row.original;
            return (
              <Select
                defaultValue={shop.status}
                onValueChange={(value: "active" | "inactive") =>
                  handleStatusChange(shop, value)
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
    // Añadimos columna de acciones
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const shop = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("openMenu")}</span>
                <Edit className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Sheet>
                <SheetTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div className="flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      {t("edit")}
                    </div>
                  </DropdownMenuItem>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{t("editShop")}</SheetTitle>
                    <SheetDescription>{t("editShopDesc")}</SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <ShopForm shop={shop} />
                  </div>
                </SheetContent>
              </Sheet>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setShopToDelete(shop);
                    }}
                    className="text-red-600"
                  >
                    <div className="flex items-center">
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("delete")}
                    </div>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteWarning", { name: shop.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteShop}
                      className="bg-red-600"
                    >
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: shops,
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
      <div className="flex items-center justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addShop")}
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("createShop")}</SheetTitle>
              <SheetDescription>{t("createShopDesc")}</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <ShopForm shop={null} />
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
                  {shops.length === 0 ? t("noData") : t("noResults")}
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
