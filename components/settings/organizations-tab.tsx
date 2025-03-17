"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationsList } from "@/components/organizations/organizations-list";
import { OrganizationWithRole } from "@/types/organization";
import { User } from "@/app/actions/users";
import { UsersTable } from "../users/users-table";
import { ColumnDef } from "@tanstack/react-table";
import { Shop } from "@/types/shops";
import { ShopsTable } from "../shops/shops-table";
import { createShopColumns } from "../shops/shop-columns";
import { createOrganization } from "@/app/actions/organizations";
import { toast } from "sonner";

interface OrganizationsTabProps {
  organizations: OrganizationWithRole[];
  users: User[];
  shops: Shop[];
  userColumns?: ColumnDef<User>[];
  onUpdateUserRole?: (userId: string, role: string) => Promise<void>;
  onRemoveUser?: (userId: string) => Promise<void>;
}

export function OrganizationsTab({
  organizations,
  users,
  shops,
  userColumns = [],
  onUpdateUserRole,
  onRemoveUser,
}: OrganizationsTabProps) {
  const t = useTranslations();
  const tOrg = useTranslations("organizations");
  const tUsers = useTranslations("users");
  const tShops = useTranslations("shops");
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error(tOrg("nameRequired"));
      return;
    }

    setIsCreating(true);
    try {
      const result = await createOrganization(newOrgName);
      if (result.success) {
        toast.success(tOrg("createSuccess"));
        setCreateDialogOpen(false);
        setNewOrgName("");
        // Aquí se podría recargar la lista de organizaciones
      } else {
        toast.error(result.error || tOrg("createError"));
      }
    } catch (error) {
      console.error("Error al crear organización:", error);
      toast.error(tOrg("createError"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{tOrg("title")}</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {tOrg("create")}
        </Button>
      </div>

      <Tabs defaultValue="organizations" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="organizations">
            {tOrg("organizations")}
          </TabsTrigger>
          <TabsTrigger value="users">{tUsers("title")}</TabsTrigger>
          <TabsTrigger value="shops">{tShops("title")}</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <OrganizationsList organizations={organizations} />
        </TabsContent>

        <TabsContent value="users">
          <UsersTable
            users={users}
            columns={userColumns}
            onUpdateUserRole={onUpdateUserRole}
            onRemoveUser={onRemoveUser}
          />
        </TabsContent>

        <TabsContent value="shops">
          <ShopsTable shops={shops} columns={createShopColumns(t)} />
        </TabsContent>
      </Tabs>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tOrg("create")}</DialogTitle>
            <DialogDescription>{tOrg("createDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{tOrg("name")}</Label>
              <Input
                id="name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder={tOrg("namePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleCreateOrganization}
              disabled={isCreating}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tOrg("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
