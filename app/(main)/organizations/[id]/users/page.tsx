import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getUser } from "@/app/actions/auth";
import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { OrganizationUsers } from "@/components/organizations/organization-users";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface UsersPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Usuarios de la Organización",
  description: "Gestiona los usuarios de tu organización",
};

export default async function UsersPage({ params }: UsersPageProps) {
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

  // Obtener conteo de usuarios en esta organización
  const { count: usersCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", id);

  // Obtener información del usuario actual desde la tabla users
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // Determinar si el usuario es admin basado en la información de la tabla users
  const isAdmin =
    userData?.role === "admin" || userData?.role === "super_admin";

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
              <BreadcrumbLink>{t("users.title")}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          {t("users.title")}
        </h1>
        <p className="text-muted-foreground">
          {organization.name} - {usersCount || 0}{" "}
          {usersCount === 1
            ? t("organizations.userManagement.countSuffixSingular")
            : t("organizations.userManagement.countSuffix")}
        </p>
      </div>

      <OrganizationUsers organizationId={id} isAdmin={isAdmin} />
    </div>
  );
}
