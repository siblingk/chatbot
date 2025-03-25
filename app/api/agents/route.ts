import { NextResponse } from "next/server";
import { getAgents } from "@/app/actions/agents";
import { getUserRole } from "@/app/actions/auth";

export async function GET() {
  try {
    // Obtener el rol del usuario actual
    const { role } = await getUserRole();

    // Obtener todos los agentes (activos y sin filtrar por rol)
    const agents = await getAgents(false, false);

    return NextResponse.json({
      success: true,
      role,
      isAdminOrSuperAdmin: role === "admin" || role === "super_admin",
      agentCount: agents.length,
      agents,
    });
  } catch (error) {
    console.error("Error al obtener agentes:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener agentes" },
      { status: 500 }
    );
  }
}
