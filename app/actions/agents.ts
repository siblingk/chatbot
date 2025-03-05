"use server";
import { cookies } from "next/headers";
import { Agent } from "@/types/agents";
import { createClient } from "@/utils/supabase/server";

export async function getAgents(onlyActive = false, filterByRole = true) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Para depuración
  console.log("getAgents - onlyActive:", onlyActive);
  console.log("getAgents - filterByRole:", filterByRole);

  // Obtener el usuario actual y su rol
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error fetching user:", userError);
    throw userError;
  }

  // Obtener el rol del usuario
  let userRole = "user"; // Por defecto, asumimos que es un usuario normal
  let isAdmin = false;

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profileError && profile) {
      userRole = profile.role;
      isAdmin = profile.role === "admin";
    }
  }

  // Para depuración
  console.log("getAgents - Usuario es admin:", isAdmin);
  console.log("getAgents - Rol del usuario:", userRole);

  // Consulta base
  let query = supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  // Si se solicita solo agentes activos y el usuario no es administrador, añadir el filtro
  // Los administradores siempre pueden ver todos los agentes, activos e inactivos
  if (onlyActive && !isAdmin) {
    query = query.eq("is_active", true);
    console.log("getAgents - Filtrando por agentes activos");
  }

  // Si no es admin y se debe filtrar por rol, mostrar solo agentes compatibles con su rol
  // Los administradores siempre pueden ver todos los agentes, independientemente del rol
  if (!isAdmin && filterByRole) {
    // Usuarios con rol "user" ven solo agentes con target_role "user" o "both"
    // Usuarios con rol "shop" ven solo agentes con target_role "shop" o "both"
    query = query.or(`target_role.eq.${userRole},target_role.eq.both`);
    console.log(`getAgents - Filtrando por target_role: ${userRole} o both`);
  } else if (isAdmin) {
    // Para administradores, NO aplicamos ningún filtro por target_role
    console.log("getAgents - Admin: No se aplica filtro por target_role");
  }

  const { data: agents, error } = await query;

  if (error) {
    console.error("Error fetching agents:", error);
    throw error;
  }

  // Para depuración
  console.log(
    "getAgents - Número de agentes encontrados:",
    agents?.length || 0
  );
  if (agents && agents.length > 0) {
    console.log(
      "getAgents - Roles de los agentes encontrados:",
      agents.map((a) => a.target_role)
    );
  }

  return agents as Agent[];
}

export async function updateAgent(agent: Partial<Agent>) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Obtener el usuario actual
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No se pudo obtener el usuario autenticado");
  }

  // Asegurarnos de que los campos estén en snake_case
  const agentData = {
    id: agent.id,
    name: agent.name,
    model: agent.model,
    visibility: agent.visibility,
    personality_tone: agent.personality_tone,
    lead_strategy: agent.lead_strategy,
    welcome_message: agent.welcome_message,
    pre_quote_message: agent.pre_quote_message,
    pre_quote_type: agent.pre_quote_type,
    expiration_time: agent.expiration_time,
    system_instructions: agent.system_instructions,
    auto_assign_leads: agent.auto_assign_leads,
    auto_respond: agent.auto_respond,
    user_id: agent.user_id || user.id,
    created_at: agent.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: agent.is_active !== undefined ? agent.is_active : true,
    target_role: agent.target_role || "both",
    target_agent_id: agent.target_agent_id || null,
  };

  // Si estamos actualizando un agente existente (tiene ID)
  if (agent.id) {
    const { error } = await supabase
      .from("agents")
      .update({
        ...agentData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agent.id);

    if (error) {
      console.error("Error updating agent:", error);
      throw error;
    }
  }
  // Si estamos creando un nuevo agente (no tiene ID)
  else {
    // Eliminar el id undefined para que Supabase genere uno automáticamente
    const { id, ...newAgentData } = agentData; // eslint-disable-line @typescript-eslint/no-unused-vars

    const { error } = await supabase.from("agents").insert(newAgentData);

    if (error) {
      console.error("Error creating agent:", error);
      throw error;
    }
  }
}

export async function deleteAgent(agentId: string) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { error } = await supabase.from("agents").delete().eq("id", agentId);

  if (error) {
    console.error("Error deleting agent:", error);
    throw error;
  }
}

export async function getActiveAgentById(agentId: string) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  console.log("=== INICIO getActiveAgentById ===");
  console.log("Buscando agente con ID:", agentId);

  // Verificar primero si el agente existe en absoluto (sin filtros)
  const { error: errorExists } = await supabase
    .from("agents")
    .select("id")
    .eq("id", agentId)
    .single();

  if (errorExists) {
    console.error("Error verificando existencia del agente:", errorExists);
    console.log("El agente con ID", agentId, "NO existe en la base de datos");
    return null;
  }

  console.log("El agente con ID", agentId, "SÍ existe en la base de datos");

  // Obtener el usuario actual y su rol
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error fetching user:", userError);
    return null;
  }

  // Obtener el rol del usuario
  let userRole = "user"; // Por defecto, asumimos que es un usuario normal
  let isAdmin = false;

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profileError && profile) {
      userRole = profile.role;
      isAdmin = profile.role === "admin";
      console.log("Perfil encontrado - Rol:", profile.role);
    } else {
      console.log("Error al obtener perfil:", profileError);
    }
  }

  // Para depuración
  console.log("getActiveAgentById - Usuario es admin:", isAdmin);
  console.log("getActiveAgentById - Rol del usuario:", userRole);

  // Para administradores, hacemos una consulta directa sin filtros
  if (isAdmin) {
    console.log(
      "getActiveAgentById - Usuario es admin - Consultando sin filtros"
    );
    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error) {
      console.error("Error fetching agent (admin):", error);
      console.log("Error completo:", JSON.stringify(error));
      return null;
    }

    console.log(
      "getActiveAgentById - Agente encontrado (admin):",
      agent ? "Sí" : "No"
    );
    if (agent) {
      console.log("Datos del agente:", JSON.stringify(agent));
    }
    console.log("=== FIN getActiveAgentById (admin) ===");
    return agent;
  }

  // Para usuarios normales, aplicamos los filtros correspondientes
  console.log("getActiveAgentById - Usuario normal - Aplicando filtros");

  let query = supabase.from("agents").select("*").eq("id", agentId);

  // Solo filtrar por agentes activos para usuarios normales
  query = query.eq("is_active", true);
  console.log("getActiveAgentById - Filtrando por agentes activos");

  // Filtrar por target_role compatible con el rol del usuario
  // Usuarios con rol "user" ven solo agentes con target_role "user" o "both"
  // Usuarios con rol "shop" ven solo agentes con target_role "shop" o "both"
  query = query.or(`target_role.eq.${userRole},target_role.eq.both`);
  console.log(
    `getActiveAgentById - Filtrando por target_role: ${userRole} o both`
  );

  const { data: agent, error } = await query.single();

  if (error) {
    console.error("Error fetching active agent:", error);
    console.log("Error completo:", JSON.stringify(error));
    return null;
  }

  // Para depuración
  console.log("getActiveAgentById - Agente encontrado:", agent ? "Sí" : "No");
  if (agent) {
    console.log("Datos del agente:", JSON.stringify(agent));
  }
  console.log("=== FIN getActiveAgentById (normal user) ===");

  return agent;
}

export async function getAgentById(
  agentId: string,
  ignoreActiveStatus = false
) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  console.log("=== INICIO getAgentById ===");
  console.log("Buscando agente con ID:", agentId);
  console.log("ignoreActiveStatus:", ignoreActiveStatus);

  // Verificar primero si el agente existe en absoluto (sin filtros)
  const { error: errorExists } = await supabase
    .from("agents")
    .select("id")
    .eq("id", agentId)
    .single();

  if (errorExists) {
    console.error("Error verificando existencia del agente:", errorExists);
    console.log("El agente con ID", agentId, "NO existe en la base de datos");
    return null;
  }

  console.log("El agente con ID", agentId, "SÍ existe en la base de datos");

  // Obtener el usuario actual y su rol
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error fetching user:", userError);
    return null;
  }

  console.log("Usuario ID:", user?.id);

  // Obtener el rol del usuario
  let userRole = "user"; // Por defecto, asumimos que es un usuario normal
  let isAdmin = false;

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profileError && profile) {
      userRole = profile.role;
      isAdmin = profile.role === "admin";
      console.log("Perfil encontrado - Rol:", profile.role);
    } else {
      console.log("Error al obtener perfil:", profileError);
    }
  }

  console.log("Usuario es admin:", isAdmin);
  console.log("Rol del usuario:", userRole);

  // SIMPLIFICACIÓN: Para administradores o cuando se ignora el estado activo, obtener el agente directamente
  if (isAdmin || ignoreActiveStatus) {
    console.log(
      "Usuario es admin o se ignora el estado activo - Obteniendo agente sin filtros"
    );

    // Obtener el agente completo directamente sin filtros
    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error) {
      console.error(
        "Error obteniendo agente (admin/ignoreActiveStatus):",
        error
      );
      console.log("Error completo:", JSON.stringify(error));
      return null;
    }

    console.log(
      "Agente encontrado (admin/ignoreActiveStatus):",
      agent ? "Sí" : "No"
    );
    if (agent) {
      console.log("Datos del agente:", JSON.stringify(agent));
    }
    console.log("=== FIN getAgentById (admin/ignoreActiveStatus) ===");
    return agent;
  }

  // Para usuarios normales, aplicamos los filtros correspondientes
  console.log("Usuario normal - Aplicando filtros");

  let query = supabase.from("agents").select("*").eq("id", agentId);

  // Filtrar por agentes activos
  query = query.eq("is_active", true);
  console.log("Filtrando por agentes activos");

  // Filtrar por target_role compatible con el rol del usuario
  query = query.or(`target_role.eq.${userRole},target_role.eq.both`);
  console.log(`Filtrando por target_role: ${userRole} o both`);

  const { data: agent, error } = await query.single();

  if (error) {
    console.error("Error fetching agent (normal user):", error);
    console.log("Error completo:", JSON.stringify(error));
    return null;
  }

  console.log("Agente encontrado (normal user):", agent ? "Sí" : "No");
  if (agent) {
    console.log("Datos del agente:", JSON.stringify(agent));
  }
  console.log("=== FIN getAgentById (normal user) ===");

  return agent;
}
