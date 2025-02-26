import { ColumnDef } from "@tanstack/react-table";
import { Setting } from "@/types/settings";
import { getTranslations } from "next-intl/server";

// Server component function to get translated columns
export async function getColumns() {
  const t = await getTranslations("settings");

  const columns: ColumnDef<Setting>[] = [
    {
      accessorKey: "workshop_id",
      header: t("workshopId"),
    },
    {
      accessorKey: "workshop_name",
      header: t("workshopName"),
    },
    {
      accessorKey: "interaction_tone",
      header: t("interactionTone"),
    },
    {
      accessorKey: "lead_assignment_mode",
      header: t("leadAssignmentMode"),
    },
    {
      accessorKey: "price_source",
      header: t("priceSource"),
    },
    {
      id: "actions",
      header: t("actions"),
    },
  ];

  return columns;
}
