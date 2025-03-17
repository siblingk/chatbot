"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { getPrequoteData } from "@/app/actions/prequote";

interface PrequoteData {
  id: string;
  service_type: string;
  estimated_min_cost: string;
  estimated_max_cost: string;
  currency: string;
  parts_needed: string;
  labor_hours: string;
  notes: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  session_id: string;
}

interface PrequoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  userId: string;
  initialData?: PrequoteData | null;
}

export function PrequoteDialog({
  open,
  onOpenChange,
  sessionId,
  userId,
  initialData = null,
}: PrequoteDialogProps) {
  const t = useTranslations("prequote");
  const [prequoteData, setPrequoteData] = useState<PrequoteData | null>(
    initialData
  );

  useEffect(() => {
    async function fetchData() {
      if (!open || !sessionId || !userId) return;
      if (initialData) {
        setPrequoteData(initialData);
        return;
      }

      const data = await getPrequoteData(sessionId, userId);
      setPrequoteData(data);
    }

    fetchData();
  }, [open, sessionId, userId, initialData]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {prequoteData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t("serviceType")}
                </h4>
                <p className="text-base">{prequoteData.service_type}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t("laborHours")}
                </h4>
                <p className="text-base">{prequoteData.labor_hours} hrs</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                {t("estimatedCost")}
              </h4>
              <p className="text-base">
                {formatCurrency(
                  parseFloat(prequoteData.estimated_min_cost),
                  prequoteData.currency
                )}{" "}
                -{" "}
                {formatCurrency(
                  parseFloat(prequoteData.estimated_max_cost),
                  prequoteData.currency
                )}
              </p>
            </div>

            {prequoteData.parts_needed && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t("partsNeeded")}
                </h4>
                <p className="text-base">{prequoteData.parts_needed}</p>
              </div>
            )}

            {prequoteData.notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t("notes")}
                </h4>
                <p className="text-base">{prequoteData.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t("createdAt")}
                </h4>
                <p className="text-sm">
                  {new Date(prequoteData.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t("updatedAt")}
                </h4>
                <p className="text-sm">
                  {new Date(prequoteData.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            {t("noData")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
