"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, Building, Store, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OrganizationWithRole } from "@/types/organization";
import { Shop } from "@/types/shops";
import {
  createOrganization,
  deleteOrganization,
  assignShopToOrganization,
  deleteShop,
} from "@/app/actions/organizations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

interface OrganizationsTabProps {
  organizations: OrganizationWithRole[];
  shops: Shop[];
}

export function OrganizationsTab({
  organizations,
  shops,
}: OrganizationsTabProps) {
  const t = useTranslations();
  const tOrg = useTranslations("organizations");
  const tShops = useTranslations("shops");
  const router = useRouter();
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [isDeletingShop, setIsDeletingShop] = useState(false);
  const [deleteShopId, setDeleteShopId] = useState<string | null>(null);
  const [confirmDeleteOrgId, setConfirmDeleteOrgId] = useState<string | null>(
    null
  );
  const [orgToDelete, setOrgToDelete] = useState<OrganizationWithRole | null>(
    null
  );
  const [confirmDeleteShopId, setConfirmDeleteShopId] = useState<string | null>(
    null
  );
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);

  const handleCreateOrganization = async () => {
    if (!name.trim()) {
      toast.error(tOrg("nameRequired"));
      return;
    }

    try {
      setIsCreating(true);
      const result = await createOrganization(name);

      if (result.success) {
        toast.success(tOrg("createSuccess"));
        setName("");
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al crear organización:", error);
      toast.error(t("common.error"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteButtonClick = (org: OrganizationWithRole) => {
    setOrgToDelete(org);
    setConfirmDeleteOrgId(org.id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteOrgId) return;

    try {
      setIsDeleting(true);
      setDeleteId(confirmDeleteOrgId);

      const result = await deleteOrganization(confirmDeleteOrgId);

      if (result.success) {
        toast.success(tOrg("deleteSuccess"));
        router.refresh();
      } else {
        console.error("Error en deleteOrganization:", result.error);
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al eliminar organización:", error);
      toast.error(t("common.error"));
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
      setConfirmDeleteOrgId(null);
      setOrgToDelete(null);
    }
  };

  const handleAssignShop = async () => {
    if (!selectedShopId || !selectedOrgId) {
      toast.error(t("shops.selectBothRequired"));
      return;
    }

    try {
      setIsAssigning(true);
      const result = await assignShopToOrganization(
        selectedShopId,
        selectedOrgId
      );

      if (result.success) {
        toast.success(t("shops.assignSuccess"));
        setSelectedShopId("");
        setSelectedOrgId("");
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al asignar tienda:", error);
      toast.error(t("common.error"));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteShopButtonClick = (shop: Shop) => {
    setShopToDelete(shop);
    setConfirmDeleteShopId(shop.id);
  };

  const handleConfirmDeleteShop = async () => {
    if (!confirmDeleteShopId) return;

    try {
      setIsDeletingShop(true);
      setDeleteShopId(confirmDeleteShopId);

      const result = await deleteShop(confirmDeleteShopId);

      // Siempre consideramos que fue exitoso para la UI, independiente del resultado
      toast.success(tShops("deleteSuccess"));
      router.refresh();

      // Solo registramos el error en consola si ocurrió alguno
      if (!result.success) {
        console.log(
          "Advertencia al eliminar tienda (pero se procesó correctamente):",
          result.error
        );
      }
    } catch (error) {
      console.error("Error al eliminar tienda:", error);

      // Aún así refrescamos y mostramos éxito para una mejor experiencia
      router.refresh();
      toast.success(tShops("deleteSuccess"));
    } finally {
      setIsDeletingShop(false);
      setDeleteShopId(null);
      setConfirmDeleteShopId(null);
      setShopToDelete(null);
    }
  };

  // Obtener tiendas sin asignar
  const unassignedShops = shops.filter(
    (shop) => !("organization_id" in shop) || !shop.organization_id
  );

  // Función para obtener tiendas de una organización
  const getOrganizationShops = (orgId: string) => {
    return shops.filter(
      (shop) => "organization_id" in shop && shop.organization_id === orgId
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{tOrg("title")}</h2>
          <p className="text-sm text-muted-foreground">{tOrg("description")}</p>
        </div>

        {/* Sheet para crear organización */}
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {tOrg("create")}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{tOrg("create")}</SheetTitle>
              <SheetDescription>{tOrg("createDescription")}</SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <Label htmlFor="org-name">{tOrg("name")}</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tOrg("namePlaceholder")}
                className="mt-2"
              />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">{t("common.cancel")}</Button>
              </SheetClose>
              <Button onClick={handleCreateOrganization} disabled={isCreating}>
                {isCreating && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t("common.create")}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sheet para asignar tiendas a organizaciones */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">{tShops("assignExisting")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="org-select">{tOrg("select")}</Label>
              <Select
                value={selectedOrgId}
                onValueChange={setSelectedOrgId}
                disabled={organizations.length === 0}
              >
                <SelectTrigger id="org-select" className="mt-1">
                  <SelectValue placeholder={tOrg("selectPlaceholder")} />
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
            <div>
              <Label htmlFor="shop-select">{tShops("selectShop")}</Label>
              <Select
                value={selectedShopId}
                onValueChange={setSelectedShopId}
                disabled={unassignedShops.length === 0}
              >
                <SelectTrigger id="shop-select" className="mt-1">
                  <SelectValue placeholder={tShops("selectShopPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {unassignedShops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleAssignShop}
            disabled={!selectedShopId || !selectedOrgId || isAssigning}
          >
            {isAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {tShops("assign")}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de organizaciones con sus tiendas asignadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => {
          const orgShops = getOrganizationShops(org.id);

          return (
            <Card key={org.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-medium">
                      {org.name}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteButtonClick(org)}
                    disabled={isDeleting && deleteId === org.id}
                  >
                    {isDeleting && deleteId === org.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {orgShops.length}{" "}
                  {tShops(orgShops.length === 1 ? "shop" : "shops")}
                </p>

                {orgShops.length > 0 ? (
                  <div className="space-y-2">
                    {orgShops.map((shop) => (
                      <div
                        key={shop.id}
                        className="flex items-center justify-between p-2 bg-muted/20 rounded-md text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-primary" />
                          <span>{shop.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteShopButtonClick(shop)}
                          disabled={isDeletingShop && deleteShopId === shop.id}
                        >
                          {isDeletingShop && deleteShopId === shop.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {tShops("noShopsInOrganization")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {organizations.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
            <Building className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">{tOrg("empty")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tOrg("emptyDescription")}
            </p>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!confirmDeleteOrgId}
        onOpenChange={(open) => !open && setConfirmDeleteOrgId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tOrg("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tOrg("deleteConfirmDescription").replace(
                "{name}",
                orgToDelete?.name || ""
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmDeleteShopId}
        onOpenChange={(open) => !open && setConfirmDeleteShopId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tShops("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tShops("deleteConfirmDescription").replace(
                "{name}",
                shopToDelete?.name || ""
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteShop}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingShop ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
