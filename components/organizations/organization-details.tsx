"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Trash,
  Plus,
  ArrowRight,
  Store,
  Link,
  MoreHorizontal,
} from "lucide-react";
import { Organization, OrganizationRole, Shop } from "@/types/organization";
import {
  updateOrganization,
  deleteOrganization,
  createShop,
  deleteShop,
  removeShopFromOrganization,
} from "@/app/actions/organizations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrganizationUsers } from "@/components/organizations/organization-users";

interface OrganizationDetailsProps {
  organization: Organization;
  shops: Shop[];
  isAdmin: boolean;
  userRole: OrganizationRole;
}

export function OrganizationDetails({
  organization,
  shops,
  isAdmin,
  userRole,
}: OrganizationDetailsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createShopDialogOpen, setCreateShopDialogOpen] = useState(false);
  const [name, setName] = useState(organization.name);
  const [shopName, setShopName] = useState("");
  const [shopLocation, setShopLocation] = useState("Default Location");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [deleteShopId, setDeleteShopId] = useState<string | null>(null);
  const [deleteShopDialogOpen, setDeleteShopDialogOpen] = useState(false);
  const [isDeletingShop, setIsDeletingShop] = useState(false);
  const [removeShopId, setRemoveShopId] = useState<string | null>(null);
  const [removeShopDialogOpen, setRemoveShopDialogOpen] = useState(false);
  const [isRemovingShop, setIsRemovingShop] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.error(t("common.required"));
      return;
    }

    try {
      setIsUpdating(true);
      const result = await updateOrganization(organization.id, { name });

      if (result.success) {
        toast.success(t("organizations.updateSuccess"));
        setEditDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al actualizar organización:", error);
      toast.error(t("common.error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteOrganization(organization.id);

      if (result.success) {
        toast.success(t("organizations.deleteSuccess"));
        router.push("/organizations");
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al eliminar organización:", error);
      toast.error(t("common.error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateShop = async () => {
    if (!shopName.trim()) {
      toast.error(t("shops.nameRequired"));
      return;
    }

    try {
      setIsCreatingShop(true);
      const result = await createShop(organization.id, shopName, shopLocation);

      if (result.success) {
        toast.success(t("shops.createSuccess"));
        setCreateShopDialogOpen(false);
        setShopName("");
        setShopLocation("Default Location");
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al crear tienda:", error);
      toast.error(t("common.error"));
    } finally {
      setIsCreatingShop(false);
    }
  };

  const handleDeleteShop = (shopId: string) => {
    setDeleteShopId(shopId);
    setDeleteShopDialogOpen(true);
  };

  const confirmDeleteShop = async () => {
    if (!deleteShopId) return;

    try {
      setIsDeletingShop(true);
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
      setIsDeletingShop(false);
      setDeleteShopDialogOpen(false);
    }
  };

  const handleRemoveShop = (shopId: string) => {
    setRemoveShopId(shopId);
    setRemoveShopDialogOpen(true);
  };

  const confirmRemoveShop = async () => {
    if (!removeShopId) return;

    try {
      setIsRemovingShop(true);
      const result = await removeShopFromOrganization(removeShopId);

      toast.success(t("shops.removeSuccess"));
      router.refresh();

      if (!result.success) {
        console.log(
          "Advertencia al desasociar tienda (pero se procesó correctamente):",
          result.error
        );
      }
    } catch (error) {
      console.error("Error al desasociar tienda:", error);

      router.refresh();
      toast.success(t("shops.removeSuccess"));
    } finally {
      setIsRemovingShop(false);
      setRemoveShopId(null);
      setRemoveShopDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/organizations")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("common.actions")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">{t("common.details")}</TabsTrigger>
          <TabsTrigger value="users">{t("organizations.users")}</TabsTrigger>
          <TabsTrigger value="shops">{t("organizations.shops")}</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">{t("common.information")}</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t("common.name")}</Label>
                  <div className="mt-1 text-sm">{organization.name}</div>
                </div>
                <div>
                  <Label>{t("common.slug")}</Label>
                  <div className="mt-1 text-sm">{organization.slug}</div>
                </div>
                <div>
                  <Label>{t("common.created")}</Label>
                  <div className="mt-1 text-sm">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label>{t("common.role")}</Label>
                  <div className="mt-1 text-sm capitalize">{userRole}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <OrganizationUsers
                organizationId={organization.id}
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shops">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-lg font-medium">{t("shops.title")}</h3>
              {isAdmin && (
                <Button size="sm" onClick={() => setCreateShopDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("shops.create")}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {shops && shops.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shops.map((shop) => (
                    <Card key={shop.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{shop.name}</span>
                          </div>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">
                                    {t("common.actions")}
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/shops/${shop.id}`)
                                  }
                                >
                                  <ArrowRight className="mr-2 h-4 w-4" />
                                  {t("common.view")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRemoveShop(shop.id)}
                                >
                                  <Link className="mr-2 h-4 w-4" />
                                  {t("shops.removeFromOrg")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteShop(shop.id)}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  {t("common.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {shop.location || t("shops.noLocation")}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {t("shops.noShops")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("organizations.edit")}</DialogTitle>
            <DialogDescription>
              {t("organizations.editDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("organizations.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createShopDialogOpen}
        onOpenChange={setCreateShopDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shops.create")}</DialogTitle>
            <DialogDescription>
              {t("shops.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="shopName">{t("shops.name")}</Label>
              <Input
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={t("shops.namePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shopLocation">{t("shops.location")}</Label>
              <Input
                id="shopLocation"
                value={shopLocation}
                onChange={(e) => setShopLocation(e.target.value)}
                placeholder={t("shops.locationPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleCreateShop}
              disabled={isCreatingShop}
            >
              {isCreatingShop && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("organizations.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organizations.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteShopDialogOpen}
        onOpenChange={setDeleteShopDialogOpen}
      >
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
              disabled={isDeletingShop}
            >
              {isDeletingShop && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={removeShopDialogOpen}
        onOpenChange={setRemoveShopDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shops.removeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("shops.removeConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveShop}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemovingShop}
            >
              {isRemovingShop && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("common.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
