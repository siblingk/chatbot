"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { OrganizationWithRole } from "@/types/organization";
import { Input } from "@/components/ui/input";
import { Building2, Calendar, Search } from "lucide-react";

interface OrganizationListProps {
  organizations: OrganizationWithRole[];
}

export function OrganizationList({ organizations }: OrganizationListProps) {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          placeholder={t("organizations.search")}
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredOrganizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg p-6">
          <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            {searchTerm
              ? t("organizations.noResults")
              : t("organizations.noOrganizations")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrganizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="flex flex-col gap-2 border rounded-lg p-4 hover:border-primary/50 transition-colors hover:bg-muted/50"
            >
              <span className="font-medium">{org.name}</span>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(org.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
