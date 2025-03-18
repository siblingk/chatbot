"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { createShop } from "@/app/actions/organizations";
import { Organization } from "@/types/organization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShopOrganizationFormProps {
  organizations: Organization[];
  onSuccess?: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedOrganizationId?: string | null;
}

export function ShopOrganizationForm({
  organizations,
  onSuccess,
  isOpen,
  onOpenChange,
  preselectedOrganizationId = null,
}: ShopOrganizationFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Default Location");
  const [organizationId, setOrganizationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetear el formulario cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      setName("");
      setLocation("Default Location");

      // Si hay una organización preseleccionada, usarla
      if (preselectedOrganizationId) {
        setOrganizationId(preselectedOrganizationId);
      } else {
        // Si no, usar la primera organización de la lista
        setOrganizationId(organizations.length > 0 ? organizations[0].id : "");
      }
    }
  }, [isOpen, organizations, preselectedOrganizationId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("shops.nameRequired"));
      return;
    }

    if (!organizationId) {
      toast.error(t("shops.organizationRequired"));
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createShop(organizationId, name, location);

      if (result.success) {
        toast.success(t("shops.createSuccess"));
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al crear tienda:", error);
      toast.error(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("shops.create")}</DialogTitle>
          <DialogDescription>{t("shops.createDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="organization">{t("organizations.select")}</Label>
            <Select
              value={organizationId}
              onValueChange={setOrganizationId}
              disabled={organizations.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("organizations.selectPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">{t("shops.name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("shops.namePlaceholder")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">{t("shops.location")}</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("shops.locationPlaceholder")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !organizationId}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
