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

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            {t("organizations.general")}
          </TabsTrigger>
          <TabsTrigger value="shops">{t("shops.title")}</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">
                {t("organizations.information")}
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("organizations.name")}
                </h4>
                <p>{organization.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("organizations.slug")}
                </h4>
                <p>{organization.slug}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("organizations.id")}
                </h4>
                <p className="text-sm font-mono">{organization.id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("organizations.createdAt")}
                </h4>
                <p>{new Date(organization.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("users.role")}
                </h4>
                <p>{t(`organizations.roles.${userRole}`)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="shops">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-medium">{t("shops.title")}</h3>
              <Button size="sm" onClick={() => setCreateShopDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("shops.create")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shops.length > 0 ? (
                  <div className="grid gap-4">
                    {shops.map((shop) => (
                      <div
                        key={shop.id}
                        className="flex justify-between items-center p-4 border rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Store className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{shop.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {shop.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              router.push(`/shops/${shop.id}`);
                            }}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            {t("common.view")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-600"
                            onClick={() => handleRemoveShop(shop.id)}
                          >
                            <Link className="h-4 w-4 mr-2" />
                            {t("common.remove")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteShop(shop.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            {t("common.delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t("shops.empty")}</p>
                )}
              </div>
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
