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
  SheetFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MoreHorizontal, UserPlus } from "lucide-react";
import { OrganizationRole } from "@/types/organization";

// Importar las funciones necesarias
import {
  addUserToOrganization,
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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationRole>("member");
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedMember, setSelectedMember] = useState<
    OrganizationMembersListProps["members"][0] | null
  >(null);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error(t("common.required"));
      return;
    }

    try {
      setIsInviting(true);
      const result = await addUserToOrganization(organizationId, email, role);

      if (result.success) {
        toast.success(t("organizations.inviteSuccess"));
        setInviteDialogOpen(false);
        setEmail("");
        setRole("member");
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al invitar usuario:", error);
      toast.error(t("common.error"));
    } finally {
      setIsInviting(false);
    }
  };

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

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      setIsRemoving(true);
      const result = await removeUserFromOrganization(
        organizationId,
        selectedMember.user_id
      );

      if (result.success) {
        toast.success(t("organizations.removeMemberSuccess"));
        setRemoveDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al eliminar miembro:", error);
      toast.error(t("common.error"));
    } finally {
      setIsRemoving(false);
    }
  };

  // Función para obtener las iniciales del email
  const getUserInitials = (email: string) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
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
                className="grid grid-cols-12 gap-4 p-4 items-center"
              >
                <div className="col-span-5 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={member.users?.user_metadata?.avatar_url}
                      alt={member.users?.email}
                    />
                    <AvatarFallback>
                      {getUserInitials(member.users?.email || "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{member.users?.email}</span>
                </div>
                <div className="col-span-3">
                  {isAdmin ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleUpdateRole(
                          member.user_id,
                          value as OrganizationRole
                        )
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          {t("organizations.roles.admin")}
                        </SelectItem>
                        <SelectItem value="collaborator">
                          {t("organizations.roles.collaborator")}
                        </SelectItem>
                        <SelectItem value="member">
                          {t("organizations.roles.member")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{t(`organizations.roles.${member.role}`)}</span>
                  )}
                </div>
                <div className="col-span-3">
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                    {t("users.active")}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("common.actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedMember(member);
                            setRemoveDialogOpen(true);
                          }}
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("organizations.inviteMember")}</SheetTitle>
            <SheetDescription>
              {t("organizations.inviteDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("users.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">{t("users.role")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as OrganizationRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    {t("organizations.roles.admin")}
                  </SelectItem>
                  <SelectItem value="collaborator">
                    {t("organizations.roles.collaborator")}
                  </SelectItem>
                  <SelectItem value="member">
                    {t("organizations.roles.member")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="pt-4">
            <Button type="submit" onClick={handleInvite} disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("organizations.invite")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("organizations.removeMemberConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organizations.removeMemberConfirmDescription", {
                email: selectedMember?.users?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemoving}
            >
              {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("organizations.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
