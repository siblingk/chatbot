import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    console.log("=== API: GET /api/agents/[agentId] ===");
    const { agentId } = await params;
    console.log("Buscando agente con ID:", agentId);

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Obtener el usuario actual y su rol
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "Error de autenticación" },
        { status: 401 }
      );
    }

    console.log("Usuario ID:", user?.id);

    // Obtener el rol del usuario
    let isAdmin = false;

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profileError && profile) {
        isAdmin = profile.role === "admin";
        console.log("Perfil encontrado - Rol:", profile.role);
      } else {
        console.log("Error al obtener perfil:", profileError);
      }
    }

    console.log("Usuario es admin:", isAdmin);

    // Para administradores, obtener el agente sin filtros
    if (isAdmin) {
      console.log("Usuario es admin - Obteniendo agente sin filtros");

      // Obtener el agente completo directamente
      const { data: agent, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();

      if (error) {
        console.error("Error obteniendo agente (admin):", error);
        console.log("Error completo:", JSON.stringify(error));
        return NextResponse.json(
          { error: "Agente no encontrado" },
          { status: 404 }
        );
      }

      console.log("Agente encontrado (admin):", agent ? "Sí" : "No");
      if (agent) {
        console.log("Datos del agente:", JSON.stringify(agent));
      }
      console.log("=== FIN API GET /api/agents/[agentId] ===");
      return NextResponse.json(agent);
    } else {
      // Para usuarios normales, devolver error de permisos
      return NextResponse.json(
        { error: "No tienes permisos para ver este agente" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error en API GET /api/agents/[agentId]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
