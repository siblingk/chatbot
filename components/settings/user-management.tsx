import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  Pencil,
  Trash,
  Building,
  Store,
  User,
  Search,
  Loader2,
} from "lucide-react";

import { AppRole } from "@/types/auth";
import { OrganizationWithRole, Shop } from "@/types/organization";
import {
  User as UserType,
  createUserAction,
  updateUserAction,
  getUsersAction,
} from "@/app/actions/users";
import {
  addUserToOrganization,
  getUserOrganizations,
  getOrganizationShops,
  manageUserShopAccess,
} from "@/app/actions/organizations";

interface UserManagementProps {
  initialUsers?: UserType[];
}

export function UserManagement({ initialUsers = [] }: UserManagementProps) {
  const t = useTranslations();
  const router = useRouter();

  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>(
    []
  );
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    role: "user" as AppRole,
    organization: "",
    organizationRole: "user" as OrganizationWithRole["role"],
  });

  // Cargar usuarios, organizaciones y tiendas
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Cargar usuarios si no se proporcionaron inicialmente
        if (initialUsers.length === 0) {
          const fetchedUsers = await getUsersAction();
          if (fetchedUsers.success) {
            setUsers(fetchedUsers.data || []);
          }
        }

        // Cargar organizaciones
        const fetchedOrgs = await getUserOrganizations();
        setOrganizations(fetchedOrgs || []);

        if (fetchedOrgs && fetchedOrgs.length > 0) {
          setSelectedOrg(fetchedOrgs[0].id);

          // Cargar tiendas de la primera organización
          const shopsResult = await getOrganizationShops(fetchedOrgs[0].id);
          if (shopsResult && shopsResult.success) {
            setShops(shopsResult.data || []);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error(t("common.error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [initialUsers, t]);

  // Cargar tiendas cuando cambia la organización seleccionada
  useEffect(() => {
    const fetchShops = async () => {
      if (!selectedOrg) return;

      setIsLoading(true);
      try {
        const shopsResult = await getOrganizationShops(selectedOrg);
        if (shopsResult && shopsResult.success) {
          setShops(shopsResult.data || []);
        }
      } catch (error) {
        console.error("Error al cargar tiendas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, [selectedOrg]);

  // Filtrar usuarios por búsqueda
  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.role || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const handleCreateUser = async () => {
    setIsLoading(true);
    try {
      // Crear usuario
      const result = await createUserAction({
        email: formData.email,
        role: formData.role,
      });

      if (result.success) {
        // Si se seleccionó una organización, agregar el usuario a ella
        if (formData.organization) {
          await addUserToOrganization(
            formData.organization,
            formData.email,
            formData.organizationRole
          );
        }

        toast.success(t("settings.userCreated"));
        setIsCreateDialogOpen(false);

        // Recargar usuarios
        const fetchedUsers = await getUsersAction();
        if (fetchedUsers.success) {
          setUsers(fetchedUsers.data || []);
        }

        // Resetear formulario
        setFormData({
          email: "",
          role: "user",
          organization: "",
          organizationRole: "user",
        });
      } else {
        toast.error(result.message || t("common.error"));
      }
    } catch (error) {
      console.error("Error al crear usuario:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      // Actualizar usuario
      const result = await updateUserAction({
        id: selectedUser.id,
        role: formData.role,
      });

      if (result.success) {
        // Si se seleccionó una organización, agregar/actualizar el usuario en ella
        if (formData.organization) {
          await addUserToOrganization(
            formData.organization,
            selectedUser.email,
            formData.organizationRole
          );
        }

        toast.success(t("settings.userUpdated"));
        setIsEditDialogOpen(false);

        // Recargar usuarios
        const fetchedUsers = await getUsersAction();
        if (fetchedUsers.success) {
          setUsers(fetchedUsers.data || []);
        }
      } else {
        toast.error(result.message || t("common.error"));
      }
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditDialog = (user: UserType) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      role: (user.role || "user") as AppRole,
      organization: "",
      organizationRole: "user",
    });
    setIsEditDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-red-500 hover:bg-red-600">{role}</Badge>;
      case "admin":
        return <Badge className="bg-blue-500 hover:bg-blue-600">{role}</Badge>;
      case "colaborador":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">{role}</Badge>
        );
      case "shop":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">{role}</Badge>
        );
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.userManagement")}</CardTitle>
        <CardDescription>
          {t("settings.userManagementDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">
              <User className="h-4 w-4 mr-2" />
              {t("settings.users")}
            </TabsTrigger>
            <TabsTrigger value="organizations">
              <Building className="h-4 w-4 mr-2" />
              {t("settings.organizations")}
            </TabsTrigger>
            <TabsTrigger value="shops">
              <Store className="h-4 w-4 mr-2" />
              {t("settings.shops")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("settings.createUser")}
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.email")}</TableHead>
                    <TableHead>{t("users.role")}</TableHead>
                    <TableHead>{t("users.lastLogin")}</TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center h-24 text-muted-foreground"
                      >
                        {isLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        ) : searchQuery ? (
                          t("common.noResults")
                        ) : (
                          t("settings.noUsers")
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.email}
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.last_sign_in_at
                            ? new Date(
                                user.last_sign_in_at
                              ).toLocaleDateString()
                            : t("users.never")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="organizations">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() => router.push("/settings/organizations/new")}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("settings.createOrganization")}
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("organizations.name")}</TableHead>
                    <TableHead>{t("organizations.email")}</TableHead>
                    <TableHead>{t("organizations.address")}</TableHead>
                    <TableHead>{t("organizations.shops")}</TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center h-24 text-muted-foreground"
                      >
                        {isLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        ) : (
                          t("settings.noOrganizations")
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizations
                      .filter((org) =>
                        searchQuery
                          ? org.name
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                          : true
                      )
                      .map((org) => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">
                            {org.name}
                          </TableCell>
                          <TableCell>{org.email || "-"}</TableCell>
                          <TableCell>{org.address || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-gray-100 text-gray-800"
                            >
                              {org.shops?.length || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/organizations/${org.slug}`)
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="shops">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="organizationFilter" className="mr-2">
                    {t("settings.organization")}:
                  </Label>
                  <Select
                    value={selectedOrg || ""}
                    onValueChange={(value) => setSelectedOrg(value || null)}
                  >
                    <SelectTrigger
                      id="organizationFilter"
                      className="w-[200px]"
                    >
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

                <div className="flex items-center gap-2">
                  <div className="relative w-[200px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("common.search")}
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {selectedOrg && (
                    <Button
                      onClick={() =>
                        router.push(`/organizations/${selectedOrg}/shops/new`)
                      }
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t("settings.createShop")}
                    </Button>
                  )}
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("shops.name")}</TableHead>
                      <TableHead>{t("shops.location")}</TableHead>
                      <TableHead>{t("shops.status")}</TableHead>
                      <TableHead>{t("shops.organization")}</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedOrg ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center h-24 text-muted-foreground"
                        >
                          {t("settings.selectOrganizationToViewShops")}
                        </TableCell>
                      </TableRow>
                    ) : isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : shops.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center h-24 text-muted-foreground"
                        >
                          {t("settings.noShops")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      shops
                        .filter((shop) =>
                          searchQuery
                            ? shop.name
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            : true
                        )
                        .map((shop) => {
                          const org = organizations.find(
                            (o) => o.id === shop.organization_id
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
                              <TableCell>{org?.name || "-"}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    router.push(
                                      `/organizations/${shop.organization_id}/shops/${shop.id}`
                                    )
                                  }
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Diálogo para crear usuario */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("settings.createUser")}</DialogTitle>
            <DialogDescription>
              {t("settings.createUserDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("settings.email")}</Label>
              <Input
                className="col-span-3"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("settings.role")}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as AppRole })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("settings.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    {t("settings.roles.super_admin")}
                  </SelectItem>
                  <SelectItem value="admin">
                    {t("settings.roles.admin")}
                  </SelectItem>
                  <SelectItem value="colaborador">
                    {t("settings.roles.colaborador")}
                  </SelectItem>
                  <SelectItem value="user">
                    {t("settings.roles.user")}
                  </SelectItem>
                  <SelectItem value="shop">
                    {t("settings.roles.shop")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("settings.organization")}</Label>
              <Select
                value={formData.organization}
                onValueChange={(value) =>
                  setFormData({ ...formData, organization: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("settings.selectOrganization")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("settings.none")}</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.organization && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{t("settings.orgRole")}</Label>
                <Select
                  value={formData.organizationRole}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      organizationRole: value as OrganizationWithRole["role"],
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t("settings.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      {t("settings.roles.admin")}
                    </SelectItem>
                    <SelectItem value="colaborador">
                      {t("settings.roles.colaborador")}
                    </SelectItem>
                    <SelectItem value="user">
                      {t("settings.roles.user")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsCreateDialogOpen(false)}
              variant="outline"
            >
              {t("settings.cancel")}
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isLoading || !formData.email}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("settings.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("settings.editUser")}</DialogTitle>
            <DialogDescription>
              {t("settings.editUserDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("settings.email")}</Label>
              <Input
                className="col-span-3"
                value={formData.email}
                disabled
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("settings.role")}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as AppRole })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("settings.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    {t("settings.roles.super_admin")}
                  </SelectItem>
                  <SelectItem value="admin">
                    {t("settings.roles.admin")}
                  </SelectItem>
                  <SelectItem value="colaborador">
                    {t("settings.roles.colaborador")}
                  </SelectItem>
                  <SelectItem value="user">
                    {t("settings.roles.user")}
                  </SelectItem>
                  <SelectItem value="shop">
                    {t("settings.roles.shop")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("settings.organization")}</Label>
              <Select
                value={formData.organization}
                onValueChange={(value) =>
                  setFormData({ ...formData, organization: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("settings.selectOrganization")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("settings.none")}</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.organization && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{t("settings.orgRole")}</Label>
                <Select
                  value={formData.organizationRole}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      organizationRole: value as OrganizationWithRole["role"],
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t("settings.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      {t("settings.roles.admin")}
                    </SelectItem>
                    <SelectItem value="colaborador">
                      {t("settings.roles.colaborador")}
                    </SelectItem>
                    <SelectItem value="user">
                      {t("settings.roles.user")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsEditDialogOpen(false)}
              variant="outline"
            >
              {t("settings.cancel")}
            </Button>
            <Button onClick={handleEditUser} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("settings.update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
