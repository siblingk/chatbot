import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Verificar que el usuario esté autenticado
    const { data: userSession } = await supabase.auth.getSession();
    if (!userSession?.session) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener todos los talleres sin organización asignada
    const { data: unassignedShops, error } = await supabase
      .from("shops")
      .select("*")
      .is("organization_id", null);

    if (error) {
      console.error("Error al obtener talleres sin asignar:", error);
      return NextResponse.json(
        { success: false, error: "Error al obtener talleres sin asignar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, shops: unassignedShops });
  } catch (error) {
    console.error("Error en la API de talleres sin asignar:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
