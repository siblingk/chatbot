import { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/settings/user-management";
import { UserShopAccess } from "@/components/settings/user-shop-access";
import { getUsers } from "@/app/actions/users";
import { getUserOrganizations } from "@/app/actions/organizations";

export const metadata: Metadata = {
  title: "Configuración",
  description: "Gestiona la configuración de la aplicación",
};

export default async function SettingsPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const t = await getTranslations();

  // Verificar sesión de usuario
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    redirect("/login");
  }

  // Verificar permisos de administrador
  const { data: userData } = await supabase
    .from("users")
    .select("role, is_super_admin")
    .eq("id", session.session.user.id)
    .single();

  const isAdmin =
    userData?.is_super_admin ||
    userData?.role === "admin" ||
    userData?.role === "super_admin";

  if (!isAdmin) {
    redirect("/");
  }

  // Obtener datos para componentes
  const users = await getUsers();
  const organizations = await getUserOrganizations();

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">{t("settings.title")}</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users">{t("settings.users")}</TabsTrigger>
          <TabsTrigger value="user-shop-access">
            {t("settings.userShopAccess")}
          </TabsTrigger>
          <TabsTrigger value="system">{t("settings.system")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement initialUsers={users} />
        </TabsContent>

        <TabsContent value="user-shop-access">
          <UserShopAccess users={users} organizations={organizations} />
        </TabsContent>

        <TabsContent value="system">
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">
              {t("settings.systemSettings")}
            </h3>
            <p className="text-muted-foreground">{t("settings.comingSoon")}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
