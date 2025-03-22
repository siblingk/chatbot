"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  deleteShop,
  assignShopToOrganization,
} from "@/app/actions/organizations";
import { toast } from "sonner";
import { Shop } from "@/types/organization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Store,
  Loader2,
  StoreIcon,
  LinkIcon,
  CheckCircle,
  AlertCircle,
  MapPin,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUserRole } from "@/hooks/useUserRole";
import { ShopForm } from "@/components/shops/shop-form";

interface OrganizationShopsProps {
  organizationId: string;
}

export function OrganizationShops({ organizationId }: OrganizationShopsProps) {
  const t = useTranslations();
  const [shops, setShops] = useState<Shop[]>([]);
  const [unassignedShops, setUnassignedShops] = useState<Shop[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [unassignedSearchTerm, setUnassignedSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [unassignedLoading, setUnassignedLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [deleteConfirmShopId, setDeleteConfirmShopId] = useState<string | null>(
    null
  );
  const router = useRouter();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    async function fetchShops() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/organizations/${organizationId}/shops`
        );
        const data = await response.json();

        if (data.success) {
          setShops(data.shops);
        } else {
          toast.error(t("shops.error"));
        }
      } catch (error) {
        toast.error(t("shops.error"));
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchShops();
  }, [organizationId, t]);

  useEffect(() => {
    async function fetchUnassignedShops() {
      try {
        setUnassignedLoading(true);
        const response = await fetch(`/api/shops/unassigned`);
        const data = await response.json();

        if (data.success) {
          setUnassignedShops(data.shops);
        } else {
          toast.error(t("shops.error"));
        }
      } catch (error) {
        toast.error(t("shops.error"));
        console.error(error);
      } finally {
        setUnassignedLoading(false);
      }
    }

    fetchUnassignedShops();
  }, [t]);

  const filteredShops = shops.filter(
    (shop) =>
      shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnassignedShops = unassignedShops.filter(
    (shop) =>
      shop.name?.toLowerCase().includes(unassignedSearchTerm.toLowerCase()) ||
      shop.location?.toLowerCase().includes(unassignedSearchTerm.toLowerCase())
  );

  const handleDeleteShop = async (shopId: string) => {
    try {
      const result = await deleteShop(shopId);

      if (result.success) {
        toast.success("Taller eliminado correctamente");

        // Actualizar la lista de talleres localmente
        setShops((prevShops) => prevShops.filter((shop) => shop.id !== shopId));
        setDeleteConfirmShopId(null);

        router.refresh();
      } else {
        toast.error(result.error || "Error al eliminar el taller");
      }
    } catch (error: unknown) {
      toast.error("Error al eliminar el taller");
      console.error(error);
    }
  };

  const handleAssignShop = async (shopId: string) => {
    try {
      setIsAssigning(shopId);
      const result = await assignShopToOrganization(shopId, organizationId);

      if (result.success) {
        toast.success("Taller asignado correctamente");

        // Actualizar las listas localmente
        const assignedShop = unassignedShops.find((shop) => shop.id === shopId);
        if (assignedShop) {
          setUnassignedShops((prevShops) =>
            prevShops.filter((shop) => shop.id !== shopId)
          );
          setShops((prevShops) => [...prevShops, assignedShop]);
        }
      } else {
        toast.error(result.error || "Error al asignar el taller");
      }
    } catch (error: unknown) {
      toast.error("Error al asignar el taller");
      console.error(error);
    } finally {
      setIsAssigning(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40 flex items-center gap-1 px-2 py-0.5"
        >
          <CheckCircle className="h-3 w-3" />
          <span>{t("shops.active")}</span>
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/40 flex items-center gap-1 px-2 py-0.5"
      >
        <AlertCircle className="h-3 w-3" />
        <span>{t("shops.inactive")}</span>
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {t("shops.title")}
            </CardTitle>
            <CardDescription>
              {t("organizations.shopsManagement.description")}
            </CardDescription>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("organizations.shopsManagement.addShopButton")}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("shops.createShop")}</SheetTitle>
                <SheetDescription>{t("shops.createShopDesc")}</SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <ShopForm organizationId={organizationId} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder={t("organizations.shopsManagement.searchShops")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-10">
            <StoreIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {t("shops.noShopsInOrganization")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAdmin ? t("shops.addShopsInfo") : t("shops.noShopsAssigned")}
            </p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("location")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  {isAdmin && (
                    <TableHead className="w-[80px] text-right">
                      {t("organizations.shopsManagement.actions")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShops.map((shop) => (
                  <TableRow
                    key={shop.id}
                    className={cn(
                      "hover:bg-muted/30 group",
                      deleteConfirmShopId === shop.id && "bg-muted/50"
                    )}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 mr-2" />
                        {shop.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {shop.location || t("shops.noLocation")}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(shop.status)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {deleteConfirmShopId === shop.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmShopId(null)}
                            >
                              {t("shops.cancel")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteShop(shop.id)}
                            >
                              {t("shops.delete")}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => setDeleteConfirmShopId(shop.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {isAdmin && (
          <TabsContent value="unassigned">
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder={t("shops.searchUnassignedShops")}
                className="pl-10"
                value={unassignedSearchTerm}
                onChange={(e) => setUnassignedSearchTerm(e.target.value)}
              />
            </div>

            {unassignedLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUnassignedShops.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                  {t("shops.noUnassignedShops")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("shops.allShopsAssigned")}
                </p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("location")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">
                        {t("organizations.shopsManagement.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnassignedShops.map((shop) => (
                      <TableRow key={shop.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Store className="h-4 w-4 mr-2" />
                            {shop.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {shop.location || t("shops.noLocation")}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(shop.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={isAssigning === shop.id}
                            onClick={() => handleAssignShop(shop.id)}
                          >
                            {isAssigning === shop.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <LinkIcon className="h-4 w-4 mr-1" />
                            )}
                            {t("shops.assign")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        )}
      </CardContent>
    </Card>
  );
}
