import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function OrganizationsPage() {
  // Verificar si el usuario está autenticado
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/auth/signin");
  }

  // Verificar si el usuario es administrador
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    redirect("/");
  }

  // Redirigir a la página principal
  // El usuario puede acceder a las organizaciones desde el modal de configuración
  redirect("/");
}
