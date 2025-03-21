import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Settings, Store, Users, CalendarDays, Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface OrganizationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("organizations.detailsPage.title"),
    description: t("organizations.detailsPage.description"),
  };
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
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

  // Obtener conteo de usuarios en esta organización
  const { count: usersCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", id);

  // La tabla organization_users ya no existe, usamos el rol del usuario directamente
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
              <BreadcrumbLink>{organization.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {organization.name}
            </h1>
            <div className="text-muted-foreground mt-1 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>
                {t("organizations.createdAt")}{" "}
                {formatDate(organization.created_at)}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href={`/organizations/${id}/settings`}>
              <Settings className="h-4 w-4" />
              {t("organizations.detailsPage.configButton")}
            </Link>
          </Button>
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-6">
        {t("organizations.management")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href={`/organizations/${id}/shops`}
          className="border rounded-lg p-6 hover:border-primary/50 transition-colors hover:bg-muted/50 block"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <Store className="h-10 w-10 text-primary/80" />
            <div>
              <h3 className="text-xl font-medium">{t("shops.title")}</h3>
              <p className="text-muted-foreground mt-1">
                {shopsCount || 0}{" "}
                {shopsCount === 1
                  ? t("organizations.shopsManagement.countSuffixSingular")
                  : t("organizations.shopsManagement.countSuffix")}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/organizations/${id}/users`}
          className="border rounded-lg p-6 hover:border-primary/50 transition-colors hover:bg-muted/50 block"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <Users className="h-10 w-10 text-primary/80" />
            <div>
              <h3 className="text-xl font-medium">{t("users.title")}</h3>
              <p className="text-muted-foreground mt-1">
                {usersCount || 0}{" "}
                {usersCount === 1
                  ? t("organizations.userManagement.countSuffixSingular")
                  : t("organizations.userManagement.countSuffix")}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
