import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getUser } from "@/app/actions/auth";
import { Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { OrganizationShops } from "@/components/organizations/organization-shops";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ShopsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("organizations.shopsManagement.title"),
    description: t("organizations.shopsManagement.description"),
  };
}

export default async function ShopsPage({ params }: ShopsPageProps) {
  const { id } = await params;
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const user = await getUser();
  const t = await getTranslations();

  if (!user) {
    notFound();
  }

  // Obtener detalles de la organización
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !organization) {
    notFound();
  }

  // Obtener conteo de talleres en esta organización
  const { count: shopsCount } = await supabase
    .from("shops")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", id);

  // Obtener conteo de talleres sin asignar
  const { count: unassignedShopsCount } = await supabase
    .from("shops")
    .select("*", { count: "exact", head: true })
    .is("organization_id", null);

  // La tabla organization_users ya no existe, usamos el rol del usuario directamente
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/organizations">
                {t("organizations.title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/organizations/${id}`}>
                {organization.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>
                {t("organizations.shopsManagement.title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6" />
          {t("organizations.shopsManagement.title")}
        </h1>
        <p className="text-muted-foreground">
          {organization.name} - {shopsCount || 0}{" "}
          {shopsCount === 1
            ? t("organizations.shopsManagement.countSuffixSingular")
            : t("organizations.shopsManagement.countSuffix")}{" "}
          {isAdmin &&
            `(${unassignedShopsCount || 0} ${t("shops.unassignedAvailable")})`}
        </p>
      </div>

      <OrganizationShops organizationId={id} isAdmin={isAdmin} />
    </div>
  );
}
