import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = id;
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Verificar que el usuario tenga acceso a la organización
    const { data: userSession } = await supabase.auth.getSession();
    if (!userSession?.session) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener todos los shops de la organización
    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select("*")
      .eq("organization_id", organizationId);

    if (shopsError) {
      console.error("Error al obtener shops de la organización:", shopsError);
      return NextResponse.json(
        { success: false, error: "Error al obtener talleres" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, shops });
  } catch (error) {
    console.error("Error en la API de shops de organización:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
