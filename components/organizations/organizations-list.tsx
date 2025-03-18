"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Users, Building, Trash, Pencil } from "lucide-react";
import { OrganizationWithRole } from "@/types/organization";
import { useState } from "react";
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
  deleteOrganization,
  updateOrganization,
} from "@/app/actions/organizations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface OrganizationsListProps {
  organizations: OrganizationWithRole[];
}

export function OrganizationsList({ organizations }: OrganizationsListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] =
    useState<OrganizationWithRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [organizationToEdit, setOrganizationToEdit] =
    useState<OrganizationWithRole | null>(null);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDeleteClick = (organization: OrganizationWithRole) => {
    setOrganizationToDelete(organization);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (organization: OrganizationWithRole) => {
    setOrganizationToEdit(organization);
    setNewName(organization.name);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!organizationToEdit) return;
    if (!newName.trim()) {
      toast.error(t("common.required"));
      return;
    }

    try {
      setIsUpdating(true);
      const result = await updateOrganization(organizationToEdit.id, {
        name: newName,
      });

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

  const handleDeleteConfirm = async () => {
    if (!organizationToDelete) return;

    try {
      setIsDeleting(true);
      const result = await deleteOrganization(organizationToDelete.id);

      if (result.success) {
        toast.success(t("organizations.deleteSuccess"));
        router.refresh();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Error al eliminar organización:", error);
      toast.error(t("common.error"));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("organizations.empty")}
        </h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {t("organizations.emptyDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <Card key={org.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{org.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">{t("common.actions")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {org.role === "admin" && (
                    <DropdownMenuItem onClick={() => handleEditClick(org)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("common.edit")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={`/organizations/${org.id}/members`}>
                      <Users className="mr-2 h-4 w-4" />
                      {t("organizations.manageMembers")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/organizations/${org.id}/settings`}>
                      <Building className="mr-2 h-4 w-4" />
                      {t("organizations.settings")}
                    </Link>
                  </DropdownMenuItem>
                  {org.role === "admin" && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteClick(org)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      {t("organizations.delete")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription>
              {t(`organizations.roles.${org.role}`)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("organizations.id")}: {org.id}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/organizations/${org.id}`}>
                {t("organizations.view")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("organizations.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organizations.deleteConfirmDescription", {
                name: organizationToDelete?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
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
    </div>
  );
}
