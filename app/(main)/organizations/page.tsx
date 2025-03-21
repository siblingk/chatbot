import { Metadata } from "next";
import { getUserOrganizations } from "@/app/actions/organizations";
import { getTranslations } from "next-intl/server";

import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";
import { OrganizationList } from "@/components/organizations/organization-list";
import { Building2 } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("organizations.title"),
    description: t("organizations.description"),
  };
}

export default async function OrganizationsPage() {
  const organizations = await getUserOrganizations();
  const t = await getTranslations();

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {t("organizations.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("organizations.description")}
          </p>
        </div>
        <CreateOrganizationDialog />
      </div>

      <OrganizationList organizations={organizations} />
    </div>
  );
}
