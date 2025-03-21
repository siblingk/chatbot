"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Pencil, Search } from "lucide-react";

import { User } from "@/app/actions/users";
import type {
  OrganizationWithRole,
  Shop,
  UserShopAccess as UserShopAccessType,
} from "@/types/organization";
import { manageUserShopAccess } from "@/app/actions/organizations";

interface UserShopAccessProps {
  users?: User[];
  organizations?: OrganizationWithRole[];
}

export function UserShopAccess({
  users = [],
  organizations = [],
}: UserShopAccessProps) {
  const t = useTranslations();

  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [userShopAccess, setUserShopAccess] = useState<UserShopAccessType[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    shopId: "",
    canView: true,
    canEdit: false,
  });

  // Cargar tiendas cuando cambia la organización seleccionada
  useEffect(() => {
    const fetchShopsForOrg = async () => {
      if (!selectedOrg) return;

      setIsLoading(true);
      try {
        // Encuentra la organización seleccionada
        const org = organizations.find((o) => o.id === selectedOrg);
        if (org) {
          setShops(org.shops || []);
        }
      } catch (error) {
        console.error("Error al cargar tiendas:", error);
        toast.error(t("common.error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopsForOrg();
  }, [selectedOrg, organizations, t]);

  // Cargar accesos de usuario cuando cambia el usuario o la organización
  useEffect(() => {
    const fetchUserAccess = async () => {
      if (!selectedUser || !selectedOrg) return;

      setIsLoading(true);
      try {
        // Aquí implementaríamos la llamada a la API para obtener los accesos
        // Por ahora, simularemos datos para ejemplo
        const mockAccess = shops.map((shop) => ({
          id: `${selectedUser}-${shop.id}`,
          user_id: selectedUser,
          shop_id: shop.id,
          can_view: Math.random() > 0.3, // Simulación
          can_edit: Math.random() > 0.6, // Simulación
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        setUserShopAccess(mockAccess);
      } catch (error) {
        console.error("Error al cargar accesos:", error);
        toast.error(t("common.error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAccess();
  }, [selectedUser, selectedOrg, shops, t]);

  // Filtrar tiendas según término de búsqueda
  const filteredShops = searchQuery
    ? shops.filter((shop) =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : shops;

  const handleOpenDialog = (userId = "", shopId = "") => {
    setFormData({
      userId: userId || selectedUser || "",
      shopId,
      canView: true,
      canEdit: false,
    });
    setIsDialogOpen(true);
  };

  const handleSaveAccess = async () => {
    if (!formData.userId || !formData.shopId) {
      toast.error(t("settings.selectUserAndShop"));
      return;
    }

    setIsLoading(true);
    try {
      const result = await manageUserShopAccess({
        userId: formData.userId,
        shopId: formData.shopId,
        canView: formData.canView,
        canEdit: formData.canEdit,
      });

      if (result && result.success) {
        toast.success(t("settings.accessUpdated"));
        setIsDialogOpen(false);

        // Actualizar la lista local para reflejar el cambio
        const updatedAccess = userShopAccess.map((access) => {
          if (
            access.user_id === formData.userId &&
            access.shop_id === formData.shopId
          ) {
            return {
              ...access,
              can_view: formData.canView,
              can_edit: formData.canEdit,
            };
          }
          return access;
        });

        // Si es un nuevo acceso, añadirlo a la lista
        const existingAccess = userShopAccess.find(
          (a) => a.user_id === formData.userId && a.shop_id === formData.shopId
        );

        if (!existingAccess) {
          updatedAccess.push({
            id: `${formData.userId}-${formData.shopId}`,
            user_id: formData.userId,
            shop_id: formData.shopId,
            can_view: formData.canView,
            can_edit: formData.canEdit,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        setUserShopAccess(updatedAccess);
      } else if (result && "error" in result) {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al actualizar acceso:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.email : userId;
  };

  const getShopName = (shopId: string) => {
    const shop = shops.find((s) => s.id === shopId);
    return shop ? shop.name : shopId;
  };

  const getUserAccessForShop = (userId: string, shopId: string) => {
    return userShopAccess.find(
      (access) => access.user_id === userId && access.shop_id === shopId
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.userShopAccess")}</CardTitle>
        <CardDescription>
          {t("settings.userShopAccessDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="organizationSelect">
                  {t("settings.organization")}:
                </Label>
                <Select
                  value={selectedOrg || ""}
                  onValueChange={(value) => {
                    setSelectedOrg(value || null);
                    setSelectedUser(null); // Reset user selection
                  }}
                >
                  <SelectTrigger id="organizationSelect" className="w-[200px]">
                    <SelectValue
                      placeholder={t("settings.selectOrganization")}
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

              {selectedOrg && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="userSelect">{t("settings.user")}:</Label>
                  <Select
                    value={selectedUser || ""}
                    onValueChange={(value) => setSelectedUser(value || null)}
                  >
                    <SelectTrigger id="userSelect" className="w-[250px]">
                      <SelectValue placeholder={t("settings.selectUser")} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.searchShops")}
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {selectedUser && selectedOrg && (
                <Button onClick={() => handleOpenDialog()}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {t("settings.addAccess")}
                </Button>
              )}
            </div>
          </div>

          {selectedOrg ? (
            selectedUser ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("shops.name")}</TableHead>
                      <TableHead>{t("shops.location")}</TableHead>
                      <TableHead>{t("shops.status")}</TableHead>
                      <TableHead>{t("settings.canView")}</TableHead>
                      <TableHead>{t("settings.canEdit")}</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredShops.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center h-24 text-muted-foreground"
                        >
                          {searchQuery
                            ? t("common.noResults")
                            : t("settings.noShops")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredShops.map((shop) => {
                        const access = getUserAccessForShop(
                          selectedUser,
                          shop.id
                        );
                        return (
                          <TableRow key={shop.id}>
                            <TableCell className="font-medium">
                              {shop.name}
                            </TableCell>
                            <TableCell>{shop.location || "-"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  shop.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-amber-100 text-amber-800"
                                }
                              >
                                {shop.status === "active"
                                  ? t("shops.statusActive")
                                  : t("shops.statusInactive")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  access?.can_view ? "default" : "outline"
                                }
                              >
                                {access?.can_view ? "✓" : "✗"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  access?.can_edit ? "default" : "outline"
                                }
                              >
                                {access?.can_edit ? "✓" : "✗"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleOpenDialog(selectedUser, shop.id)
                                }
                                title={t("settings.editAccess")}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                {t("settings.selectUserToManageAccess")}
              </div>
            )
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {t("settings.selectOrganizationToStart")}
            </div>
          )}
        </div>
      </CardContent>

      {/* Diálogo para gestionar acceso */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("settings.manageAccess")}</DialogTitle>
            <DialogDescription>
              {t("settings.manageAccessDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-4">
              <Label>{t("settings.user")}</Label>
              <div className="font-medium">{getUserName(formData.userId)}</div>
            </div>

            {!formData.shopId && (
              <div className="grid items-center gap-4">
                <Label htmlFor="shopSelect">{t("settings.shop")}</Label>
                <Select
                  value={formData.shopId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, shopId: value })
                  }
                >
                  <SelectTrigger id="shopSelect">
                    <SelectValue placeholder={t("settings.selectShop")} />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.shopId && (
              <div className="grid items-center gap-4">
                <Label>{t("settings.shop")}</Label>
                <div className="font-medium">
                  {getShopName(formData.shopId)}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canView"
                checked={formData.canView}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, canView: checked as boolean })
                }
              />
              <Label htmlFor="canView">{t("settings.canView")}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canEdit"
                checked={formData.canEdit}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, canEdit: checked as boolean })
                }
              />
              <Label htmlFor="canEdit">{t("settings.canEdit")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("settings.cancel")}
            </Button>
            <Button
              onClick={handleSaveAccess}
              disabled={isLoading || !formData.userId || !formData.shopId}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("settings.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
