/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  addUserToOrganization,
  removeUserFromOrganization,
  updateUserRole,
} from "@/app/actions/organizations";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  UserPlus,
  Loader2,
  UserX,
  Mail,
  Eye,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrganizationUsersProps {
  organizationId: string;
  isAdmin: boolean;
}

interface OrganizationUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  name?: string;
  last_sign_in_at?: string | null;
}

// Lista de roles disponibles
const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "general_lead", label: "General Lead" },
  { value: "shop_lead", label: "Shop Lead" },
  { value: "shop_owner", label: "Shop Owner" },
  { value: "shop_admin", label: "Shop Admin" },
  { value: "service_advisor", label: "Service Advisor" },
  { value: "technician", label: "Technician" },
  { value: "lead_generation_agent", label: "Lead Generation Agent" },
];

// Función para obtener el nombre legible del rol
const getRoleName = (role: string) => {
  const option = roleOptions.find((opt) => opt.value === role);
  return option ? option.label : role;
};

export function OrganizationUsers({
  organizationId,
  isAdmin,
}: OrganizationUsersProps) {
  const t = useTranslations();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("service_advisor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(
    null
  );
  const router = useRouter();

  console.log("isadmin", isAdmin);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        console.log(`Cargando usuarios para organización: ${organizationId}`);

        const response = await fetch(
          `/api/organizations/${organizationId}/users`,
          { cache: "no-store" }
        );
        const data = await response.json();

        console.log("Respuesta de API:", data);

        if (data.success) {
          setUsers(data.users);
          console.log(`Usuarios cargados: ${data.users.length}`);
        } else {
          console.error("Error al cargar usuarios:", data.error);
          toast.error("Error al cargar los usuarios");
        }
      } catch (error) {
        console.error("Excepción al cargar usuarios:", error);
        toast.error("Error al cargar los usuarios");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [organizationId]);

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async () => {
    try {
      setIsSubmitting(true);
      const result = await addUserToOrganization(
        organizationId,
        newUserEmail,
        newUserRole
      );

      if (result.success) {
        toast.success("Usuario añadido correctamente");
        setAddDialogOpen(false);
        setNewUserEmail("");
        router.refresh();

        // Añadir el nuevo usuario a la lista
        setUsers([
          ...users,
          {
            id: result.data?.id || "temp-id",
            user_id: result.data?.user_id || "temp-user-id",
            email: newUserEmail,
            role: newUserRole,
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        toast.error(result.error || "Error al añadir el usuario");
      }
    } catch (error) {
      console.error("Error al añadir usuario:", error);
      toast.error("Error al añadir el usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingRoleUserId(userId);

      console.log(
        `Actualizando rol para usuario ${userId} a ${newRole} en organización ${organizationId}`
      );

      const result = await updateUserRole(organizationId, userId, newRole);

      if (result.success) {
        // Actualizar el estado local
        setUsers(
          users.map((user) =>
            user.user_id === userId ? { ...user, role: newRole } : user
          )
        );
        toast.success("Rol actualizado correctamente");
        router.refresh();
      } else {
        toast.error(result.error || "Error al actualizar el rol");
      }
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      toast.error("Error al actualizar el rol");
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      setUpdatingRoleUserId(userId);
      const result = await removeUserFromOrganization(organizationId, userId);

      if (result.success) {
        // Eliminar el usuario de la lista local
        setUsers(users.filter((user) => user.user_id !== userId));
        toast.success("Usuario eliminado de la organización");
      } else {
        toast.error(result.error || "Error al eliminar el usuario");
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar el usuario");
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t("organizations.userManagement.title")}</CardTitle>
            <CardDescription>
              {t("organizations.userManagement.description")}
            </CardDescription>
          </div>
          {isAdmin && (
            <Sheet open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <SheetTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("organizations.userManagement.addUserButton")}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    {t("organizations.userManagement.addUserTitle")}
                  </SheetTitle>
                  <SheetDescription>
                    {t("organizations.userManagement.addUserDescription")}
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="email">{t("auth.email")}</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="role">{t("users.role")}</label>
                    <Select
                      value={newUserRole}
                      onValueChange={(value) => setNewUserRole(value)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter>
                  <Button
                    type="submit"
                    onClick={handleAddUser}
                    disabled={
                      isSubmitting ||
                      !newUserEmail ||
                      !newUserEmail.includes("@")
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t("common.add")}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("organizations.userManagement.searchUsers")}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      {t("organizations.userManagement.emailUser")}
                    </TableHead>
                    <TableHead>
                      {t("organizations.userManagement.role")}
                    </TableHead>
                    <TableHead>
                      {t("organizations.userManagement.createdAt")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("organizations.userManagement.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        {t("organizations.userManagement.noResults")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.email}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    {user.role ? (
                                      <Eye className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Mail className="h-4 w-4 text-amber-500 animate-pulse" />
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {user.role
                                    ? t(
                                        "organizations.userManagement.inviteAccepted"
                                      )
                                    : t(
                                        "organizations.userManagement.invitePending"
                                      )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Select
                              value={user.role}
                              onValueChange={(newRole) =>
                                handleUpdateRole(user.user_id, newRole)
                              }
                              disabled={updatingRoleUserId === user.user_id}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            getRoleName(user.role)
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  disabled={updatingRoleUserId === user.user_id}
                                >
                                  {updatingRoleUserId === user.user_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">
                                    {t("common.actions")}
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleRemoveUser(user.user_id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  {t("common.remove")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
