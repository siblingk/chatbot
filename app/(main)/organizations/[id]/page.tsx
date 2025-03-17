import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OrganizationDetails } from "@/components/organizations/organization-details";

interface OrganizationPageProps {
  params: {
    id: string;
  };
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Verificar si el usuario está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener la organización
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (orgError || !organization) {
    redirect("/organizations");
  }

  // Obtener todos los shops de la organización
  const { data: shops, error: shopsError } = await supabase
    .from("shops")
    .select("*")
    .eq("organization_id", id);

  if (shopsError) {
    console.error("Error al obtener shops:", shopsError);
  }

  return (
    <div className="container py-6">
      <OrganizationDetails
        organization={organization}
        shops={shops || []}
        isAdmin={true}
        userRole="admin"
      />
    </div>
  );
}
