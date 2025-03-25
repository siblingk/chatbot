import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getUserRole } from "@/app/actions/auth";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Obtener usuario autenticado
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    // Obtener el rol del usuario
    const { role } = await getUserRole();

    // Obtener información directa de la tabla users
    const { data: userData, error: userError } = !userId
      ? { data: null, error: null }
      : await supabase.from("users").select("*").eq("id", userId).single();

    // Obtener información de profiles si existe
    const { data: profileData, error: profileError } = !userId
      ? { data: null, error: null }
      : await supabase.from("profiles").select("*").eq("id", userId).single();

    return NextResponse.json({
      authenticated: !!userId,
      userId,
      authUser: authData?.user,
      getUserRoleResult: { role },
      isAdmin: role === "admin",
      isSuperAdmin: role === "super_admin",
      isGeneralLead: role === "general_lead",
      userData: userData,
      userError: userError?.message,
      profileData: profileData,
      profileError: profileError?.message,
    });
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener información del usuario",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
