"use client";
import { useState } from "react";
import { Setting } from "@/types/settings";
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
import { Edit, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { deleteSetting } from "@/app/actions/settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SettingsForm } from "./settings-form";
import { useRouter } from "next/navigation";

interface SettingsTableProps {
  settings: Setting[];
  columns: ColumnDef<Setting>[];
}

export function SettingsTable({ settings, columns }: SettingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const router = useRouter();
  const t = useTranslations("settings");

  // Función para eliminar un setting
  const confirmDelete = async (settingId: string | number) => {
    console.log("ID a eliminar:", settingId, "Tipo:", typeof settingId);

    if (!settingId) {
      toast.error(t("error"));
      console.error("ID inválido para eliminar:", settingId);
      return;
    }

    try {
      const result = await deleteSetting(settingId);

      if (result.success) {
        toast.success(t("deleteSuccess"));
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error deleting setting:", error);
      toast.error(t("error"));
    }
  };

  // Añadir columna de acciones
  const columnsWithActions: ColumnDef<Setting>[] = [
    ...columns,
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const setting = row.original;
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
                    <SheetTitle>{t("editWorkshop")}</SheetTitle>
                    <SheetDescription>{t("editWorkshopDesc")}</SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <SettingsForm setting={setting} />
                  </div>
                </SheetContent>
              </Sheet>

              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                  >
                    <div className="flex items-center">
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("delete")}
                    </div>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("confirmDelete")}</DialogTitle>
                    <DialogDescription>{t("deleteWarning")}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{t("cancel")}</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          console.log("Setting a eliminar:", setting);
                          console.log(
                            "ID del setting:",
                            setting.id,
                            "Tipo:",
                            typeof setting.id
                          );
                          confirmDelete(setting.id);
                        }}
                      >
                        {t("delete")}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: settings,
    columns: columnsWithActions,
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
              {t("addSetting")}
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("createWorkshop")}</SheetTitle>
              <SheetDescription>{t("createWorkshopDesc")}</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <SettingsForm setting={null} />
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
                  colSpan={columnsWithActions.length}
                  className="h-24 text-center"
                >
                  {settings.length === 0 ? t("noData") : t("noResults")}
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
