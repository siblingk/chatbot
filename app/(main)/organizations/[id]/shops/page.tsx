import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { OrganizationShops } from "@/components/organizations/organization-shops";

interface ShopsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Talleres de la Organización",
  description: "Gestiona los talleres de tu organización",
};

export default async function ShopsPage({ params }: ShopsPageProps) {
  const { id } = await params;
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const user = await getUser();

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

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href={`/organizations/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a la organización
          </Link>
        </Button>
      </div>

      <OrganizationShops organizationId={id} />
    </div>
  );
}
