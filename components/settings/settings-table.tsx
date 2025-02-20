"use client";

import { useState } from "react";
import { Setting } from "@/types/settings";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { deleteSetting } from "@/app/actions/settings";
import { SettingsForm } from "./settings-form";

interface SettingsTableProps {
  settings: Setting[];
}

export function SettingsTable({ settings }: SettingsTableProps) {
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta configuración?")) {
      const result = await deleteSetting(id);
      if (result.error) {
        alert(result.error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Configuraciones de Talleres</h2>
        <Button onClick={() => setIsSheetOpen(true)}>Nuevo Taller</Button>
      </div>

      <Sheet
        open={isSheetOpen || !!editingSetting}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setEditingSetting(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-[540px] md:w-[600px] lg:w-[800px] overflow-y-auto"
        >
          <SettingsForm
            setting={editingSetting}
            onClose={() => {
              setEditingSetting(null);
              setIsSheetOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      <DataTable
        columns={columns}
        data={settings}
        meta={{
          onEdit: setEditingSetting,
          onDelete: handleDelete,
        }}
      />
    </div>
  );
}
