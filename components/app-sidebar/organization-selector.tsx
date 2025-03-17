"use client";

import { useTranslations } from "next-intl";
import { Building, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/contexts/organization-context";
import { useSettingsModal } from "@/contexts/settings-modal-context";

export function OrganizationSelector() {
  const tOrg = useTranslations("organizations");
  const { openSettingsModal, setActiveTab } = useSettingsModal();
  const { currentOrganization } = useOrganization();

  const handleOpenSettings = () => {
    setActiveTab("organizations");
    openSettingsModal();
  };

  return (
    <Button
      variant="ghost"
      onClick={handleOpenSettings}
      className="w-full justify-between px-2"
    >
      <div className="flex items-center gap-2 truncate">
        <Building className="h-4 w-4 shrink-0" />
        <span className="truncate">
          {currentOrganization ? currentOrganization.name : tOrg("select")}
        </span>
      </div>
      <Settings className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );
}
