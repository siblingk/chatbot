"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MoreHorizontal, UserPlus, Eye, Mail } from "lucide-react";
import { OrganizationRole } from "@/types/organization";
import { InviteUserForm } from "@/components/users/invite-user-form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Importar las funciones necesarias
import {
  updateUserRole,
  removeUserFromOrganization,
} from "@/app/actions/organizations";

interface OrganizationMembersListProps {
  members: Array<{
    id: string;
    user_id: string;
    role: OrganizationRole;
    users?: {
      id: string;
      email: string;
      last_sign_in_at?: string | null;
      user_metadata?: {
        avatar_url?: string;
      };
    };
  }>;
  organizationId: string;
  isAdmin: boolean;
}

export function OrganizationMembersList({
  members,
  organizationId,
  isAdmin,
}: OrganizationMembersListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedMember, setSelectedMember] = useState<
    OrganizationMembersListProps["members"][0] | null
  >(null);

  const handleUpdateRole = async (
    userId: string,
    newRole: OrganizationRole
  ) => {
    try {
      setIsUpdating(true);
      const result = await updateUserRole(organizationId, userId, newRole);

      if (result.success) {
        toast.success(t("organizations.updateRoleSuccess"));
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      toast.error(t("common.error"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {t("organizations.members")} ({members.length})
        </h3>
        {isAdmin && (
          <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t("organizations.inviteMember")}
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm font-medium">
          <div className="col-span-5">{t("users.email")}</div>
          <div className="col-span-3">{t("users.role")}</div>
          <div className="col-span-3">{t("users.status")}</div>
          <div className="col-span-1 text-right">{t("users.actions")}</div>
        </div>

        {members.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {t("organizations.noMembers")}
          </div>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 items-center"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={member.users?.user_metadata?.avatar_url}
                      alt={member.users?.email || ""}
                    />
                    <AvatarFallback>
                      {member.users?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="truncate">{member.users?.email}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            {member.role ? (
                              <Eye className="h-4 w-4 text-green-500" />
                            ) : (
                              <Mail className="h-4 w-4 text-amber-500 animate-pulse" />
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {member.role
                            ? t("organizations.inviteAccepted")
                            : t("organizations.invitePending")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="col-span-3">
                  {isAdmin ? (
                    <Select
                      defaultValue={member.role}
                      disabled={isUpdating}
                      onValueChange={(value) =>
                        handleUpdateRole(
                          member.user_id,
                          value as OrganizationRole
                        )
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">
                          {t("roles.superAdmin")}
                        </SelectItem>
                        <SelectItem value="admin">
                          {t("roles.admin")}
                        </SelectItem>
                        <SelectItem value="colaborador">
                          {t("roles.colaborador")}
                        </SelectItem>
                        <SelectItem value="user">{t("roles.user")}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        member.role
                      )}`}
                    >
                      {getRoleTranslation(member.role, t)}
                    </span>
                  )}
                </div>
                <div className="col-span-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                    {t("users.active")}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">
                            {t("organizations.actions")}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMember(member);
                            setRemoveDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          {t("organizations.removeMember")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("organizations.inviteMember")}</SheetTitle>
            <SheetDescription>
              {t("organizations.inviteDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <InviteUserForm organizationId={organizationId} />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("organizations.confirmRemove")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organizations.removeDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedMember) {
                  try {
                    setIsRemoving(true);
                    await removeUserFromOrganization(
                      organizationId,
                      selectedMember.user_id
                    );
                    toast.success(t("organizations.memberRemoved"));
                    router.refresh();
                  } catch (error) {
                    console.error("Error al eliminar miembro:", error);
                    toast.error(t("common.error"));
                  } finally {
                    setIsRemoving(false);
                    setSelectedMember(null);
                  }
                }
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("organizations.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Función para obtener el color del badge según el rol
function getRoleBadgeColor(role: OrganizationRole): string {
  switch (role) {
    case "super_admin":
      return "bg-purple-100 text-purple-800";
    case "admin":
      return "bg-blue-100 text-blue-800";
    case "colaborador":
      return "bg-green-100 text-green-800";
    case "user":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Función para obtener la traducción del rol
function getRoleTranslation(
  role: OrganizationRole,
  t: (key: string) => string
): string {
  switch (role) {
    case "super_admin":
      return t("roles.superAdmin");
    case "admin":
      return t("roles.admin");
    case "colaborador":
      return t("roles.colaborador");
    case "user":
      return t("roles.user");
    default:
      return role;
  }
}
