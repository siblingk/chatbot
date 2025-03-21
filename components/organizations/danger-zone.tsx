"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteOrganization } from "@/app/actions/organizations";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DangerZoneProps {
  organizationId: string;
}

export function DangerZone({ organizationId }: DangerZoneProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (confirmation !== "ELIMINAR") {
      toast.error("Escribe 'ELIMINAR' para confirmar");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await deleteOrganization(organizationId);

      if (result.success) {
        toast.success("Organización eliminada");
        setDialogOpen(false);
        router.push("/organizations");
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    } catch (error) {
      toast.error("Error al eliminar");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-destructive/10 p-2 mt-0.5">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-destructive">
            Eliminar organización
          </h3>
          <p className="text-sm text-muted-foreground">
            Esta acción eliminará permanentemente la organización y todos sus
            datos asociados. Esta acción no se puede deshacer.
          </p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Eliminar organización</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4 p-3 bg-destructive/10 rounded-md">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium">
                Esta acción es irreversible y eliminará todos los datos
                asociados.
              </p>
            </div>
            <Label htmlFor="confirmation" className="text-sm mb-2 block">
              Escribe{" "}
              <span className="font-mono bg-secondary px-1 rounded">
                ELIMINAR
              </span>{" "}
              para confirmar
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="ELIMINAR"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || confirmation !== "ELIMINAR"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar permanentemente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
