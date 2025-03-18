"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Store,
  Building,
  Edit,
  Trash,
  ChevronDown,
  ChevronUp,
  Loader2,
  Link,
} from "lucide-react";
import { Organization } from "@/types/organization";
import { Shop } from "@/types/shops";
import { ShopOrganizationForm } from "./shop-organization-form";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import {
  deleteShop,
  assignShopToOrganization,
} from "@/app/actions/organizations";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface OrganizationShopsListProps {
  organizations: Organization[];
  shops: Shop[];
  simplified?: boolean;
}

// Extender el tipo Shop para incluir organization_id si no está en el tipo original
interface ShopWithOrganization extends Shop {
  organization_id: string;
}

export function OrganizationShopsList({
  organizations,
  shops,
  simplified = false,
}: OrganizationShopsListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [createShopDialogOpen, setCreateShopDialogOpen] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [deleteShopId, setDeleteShopId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [selectedOrgForAssign, setSelectedOrgForAssign] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Filtrar tiendas sin organización asignada
  const unassignedShops = useMemo(() => {
    return shops.filter(
      (shop) => !(shop as ShopWithOrganization).organization_id
    );
  }, [shops]);

  const handleCreateShopForOrganization = (orgId: string) => {
    setSelectedOrganizationId(orgId);
    setCreateShopDialogOpen(true);
  };

  const handleDeleteShop = (shopId: string) => {
    setDeleteShopId(shopId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteShop = async () => {
    if (!deleteShopId) return;

    try {
      setIsDeleting(true);
      const result = await deleteShop(deleteShopId);

      if (result.success) {
        toast.success(t("shops.deleteSuccess"));
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al eliminar tienda:", error);
      toast.error(t("common.error"));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const toggleAccordion = (orgId: string) => {
    setExpandedItems((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleAssignShop = async () => {
    if (!selectedShopId || !selectedOrgForAssign) {
      toast.error(t("shops.selectBothRequired"));
      return;
    }

    try {
      setIsAssigning(true);
      const result = await assignShopToOrganization(
        selectedShopId,
        selectedOrgForAssign
      );

      if (result.success) {
        toast.success(t("shops.assignSuccess"));
        setSelectedShopId("");
        setSelectedOrgForAssign("");
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

  return (
    <div className="space-y-6">
      {/* Ocultar la sección de asignación en modo simplificado */}
      {!simplified && (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shop-select">{t("shops.selectShop")}</Label>
              <Select
                value={selectedShopId}
                onValueChange={setSelectedShopId}
                disabled={unassignedShops.length === 0}
              >
                <SelectTrigger id="shop-select" className="mt-1">
                  <SelectValue placeholder={t("shops.selectShopPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {unassignedShops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unassignedShops.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {unassignedShops.length} {t("shops.unassignedAvailable")}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="org-select">{t("organizations.select")}</Label>
              <Select
                value={selectedOrgForAssign}
                onValueChange={setSelectedOrgForAssign}
                disabled={organizations.length === 0}
              >
                <SelectTrigger id="org-select" className="mt-1">
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
          </div>
          <Button
            onClick={handleAssignShop}
            className="mt-3"
            size="sm"
            disabled={
              !selectedShopId ||
              !selectedOrgForAssign ||
              isAssigning ||
              unassignedShops.length === 0
            }
          >
            {isAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Link className="h-4 w-4 mr-2" />
            {t("shops.assign")}
          </Button>
        </div>
      )}

      {!simplified && <Separator />}

      {/* Lista de organizaciones con sus tiendas en el modo normal */}
      {!simplified && (
        <div className="grid gap-4">
          {organizations.length > 0 ? (
            organizations.map((org) => {
              const orgShops = shops.filter(
                (shop) =>
                  (shop as ShopWithOrganization).organization_id === org.id
              );
              const isExpanded = expandedItems.includes(org.id);

              return (
                <Card
                  key={org.id}
                  className={cn(
                    "overflow-hidden transition-all",
                    isExpanded ? "shadow-md" : "hover:shadow-sm"
                  )}
                >
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => toggleAccordion(org.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">{org.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {orgShops.length}{" "}
                          {orgShops.length === 1
                            ? t("shops.shop")
                            : t("shops.shops")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={orgShops.length > 0 ? "default" : "outline"}
                        className="mr-2"
                      >
                        {orgShops.length}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-3">
                      <div className="flex justify-end mb-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateShopForOrganization(org.id);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t("shops.addShop")}
                        </Button>
                      </div>
                      {orgShops.length > 0 ? (
                        <ScrollArea className="max-h-[300px]">
                          <div className="space-y-2 mt-2">
                            {orgShops.map((shop) => (
                              <div
                                key={shop.id}
                                className="flex justify-between items-center p-3 border rounded-md hover:bg-accent/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Store className="h-4 w-4 text-primary" />
                                  <div>
                                    <p className="font-medium">{shop.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {shop.location}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      router.push(`/shops/${shop.id}`);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">
                                      {t("common.edit")}
                                    </span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteShop(shop.id);
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only">
                                      {t("common.delete")}
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            {t("shops.noShopsInOrganization")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center p-6 bg-muted/10 rounded-lg border">
              <p className="text-muted-foreground">
                {t("organizations.empty")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Vista simplificada para usar en la pestaña de organizaciones */}
      {simplified && (
        <div className="space-y-2">
          {organizations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => {
                const orgShops = shops.filter(
                  (shop) =>
                    (shop as ShopWithOrganization).organization_id === org.id
                );

                return (
                  <div key={org.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">{org.name}</h4>
                    </div>

                    {orgShops.length > 0 ? (
                      <div className="space-y-2">
                        {orgShops.map((shop) => (
                          <div
                            key={shop.id}
                            className="flex items-center gap-2 p-2 bg-muted/20 rounded-md"
                          >
                            <Store className="h-4 w-4 text-primary" />
                            <span className="text-sm">{shop.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">
                        {t("shops.noShopsInOrganization")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-6 bg-muted/10 rounded-lg border">
              <p className="text-muted-foreground">
                {t("organizations.empty")}
              </p>
            </div>
          )}
        </div>
      )}

      <ShopOrganizationForm
        organizations={organizations}
        isOpen={createShopDialogOpen}
        onOpenChange={setCreateShopDialogOpen}
        onSuccess={() => router.refresh()}
        preselectedOrganizationId={selectedOrganizationId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shops.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("shops.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteShop}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
