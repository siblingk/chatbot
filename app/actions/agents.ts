"use server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { Agent } from "@/types/agents";
import { getUserRole } from "@/app/actions/auth";

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

export async function getAgentWelcomeMessage(agentId: string) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  console.log("=== INICIO getAgentWelcomeMessage ===");
  console.log("Buscando mensaje de bienvenida para agente con ID:", agentId);

  if (!agentId) {
    console.log("No se proporcionó ID de agente");
    return null;
  }

  try {
    // Consulta directa para obtener solo el mensaje de bienvenida y el nombre
    const { data, error } = await supabase
      .from("agents")
      .select("name, welcome_message")
      .eq("id", agentId)
      .single();

    if (error) {
      console.error("Error al obtener mensaje de bienvenida:", error);
      return null;
    }

    console.log("Mensaje de bienvenida obtenido:", data?.welcome_message);
    console.log("Nombre del agente obtenido:", data?.name);

    // Verificar si el mensaje de bienvenida existe
    if (!data?.welcome_message) {
      console.log(
        "ADVERTENCIA: El agente no tiene un mensaje de bienvenida definido"
      );
    }

    return {
      name: data?.name || null,
      welcomeMessage: data?.welcome_message || null,
    };
  } catch (error) {
    console.error("Error en getAgentWelcomeMessage:", error);
    return null;
  } finally {
    console.log("=== FIN getAgentWelcomeMessage ===");
  }
}

/**
 * Obtiene el agente preferido del usuario actual basado en su rol.
 * Si el usuario tiene un agente asignado, devuelve ese agente.
 * Si no, devuelve el agente predeterminado para su rol.
 */
export async function getUserPreferredAgent(agentId?: string) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  console.log("=== INICIO getUserPreferredAgent ===");
  console.log("Agent ID proporcionado:", agentId);

  // Obtener el rol del usuario actual
  let userRole = "user"; // Por defecto, asumimos que es un usuario normal
  let isShop = false;

  try {
    const userRoleInfo = await getUserRole();
    userRole = userRoleInfo.role || "user";
    isShop = userRoleInfo.isShop;
    console.log("getUserPreferredAgent - Rol del usuario:", userRole);
    console.log("getUserPreferredAgent - Es tienda:", isShop);
  } catch (error) {
    console.error("Error al obtener el rol del usuario:", error);
  }

  // PRIORIDAD 1: Si hay un agentId específico, usarlo directamente
  if (agentId) {
    console.log("Buscando agente específico con ID:", agentId);

    // Consulta directa a la tabla agents por el ID
    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error) {
      console.error("Error al buscar agente por ID:", error);
    } else if (agent) {
      // Verificar si el agente es compatible con el rol del usuario
      const isCompatible =
        agent.target_role === "both" ||
        (isShop && agent.target_role === "shop") ||
        (!isShop && agent.target_role === "user");

      console.log("Agente específico encontrado:", agent.name);
      console.log("Rol objetivo del agente:", agent.target_role);
      console.log("Agente compatible con el rol del usuario:", isCompatible);
      console.log("Mensaje de bienvenida:", agent.welcome_message);

      // Solo devolver el agente si es compatible con el rol del usuario
      if (isCompatible) {
        console.log("=== FIN getUserPreferredAgent ===");
        return agent;
      } else {
        console.log(
          "El agente específico no es compatible con el rol del usuario, buscando alternativas"
        );
      }
    } else {
      console.log("No se encontró el agente específico con ID:", agentId);
    }
  }

  // PRIORIDAD 2: Obtener el usuario y su agente preferido
  let userId = null;

  try {
    // Intentar obtener el usuario actual
    const { data, error } = await supabase.auth.getUser();

    if (!error && data.user) {
      userId = data.user.id;

      // Usuario autenticado, obtener su agente preferido
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("preferred_agent_id")
        .eq("id", userId)
        .single();

      if (!profileError && profile) {
        // PRIORIDAD 3: Si el usuario tiene un agente preferido, usarlo
        if (profile.preferred_agent_id) {
          console.log(
            "Usuario tiene agente preferido:",
            profile.preferred_agent_id
          );

          const { data: preferredAgent, error: preferredError } = await supabase
            .from("agents")
            .select("*")
            .eq("id", profile.preferred_agent_id)
            .eq("is_active", true)
            .single();

          if (!preferredError && preferredAgent) {
            // Verificar si el agente preferido es compatible con el rol del usuario
            const isCompatible =
              preferredAgent.target_role === "both" ||
              (isShop && preferredAgent.target_role === "shop") ||
              (!isShop && preferredAgent.target_role === "user");

            console.log("Agente preferido encontrado:", preferredAgent.name);
            console.log(
              "Rol objetivo del agente preferido:",
              preferredAgent.target_role
            );
            console.log(
              "Agente preferido compatible con el rol del usuario:",
              isCompatible
            );

            if (isCompatible) {
              console.log(
                "Mensaje de bienvenida:",
                preferredAgent.welcome_message
              );
              console.log("=== FIN getUserPreferredAgent ===");
              return preferredAgent;
            } else {
              console.log(
                "El agente preferido no es compatible con el rol del usuario, buscando alternativas"
              );
            }
          } else {
            console.log("Agente preferido no encontrado o no está activo");
          }
        }
      }
    } else {
      console.log("Usuario no autenticado, usando rol por defecto:", userRole);
    }
  } catch (error) {
    console.error("Error al verificar usuario:", error);
    console.log("Usando rol por defecto:", userRole);
  }

  // PRIORIDAD 4: Buscar un agente específico para el rol del usuario
  console.log("Buscando agente específico para rol:", userRole);

  // Consulta para buscar agentes según el rol específico del usuario
  const { data: roleAgents, error: roleError } = await supabase
    .from("agents")
    .select("*")
    .eq("is_active", true)
    .eq("target_role", isShop ? "shop" : "user")
    .order("created_at", { ascending: false })
    .limit(1);

  if (roleError) {
    console.error("Error al buscar agentes por rol específico:", roleError);
  } else if (roleAgents && roleAgents.length > 0) {
    console.log("Agente encontrado para rol específico:", roleAgents[0].name);
    console.log("Rol objetivo del agente:", roleAgents[0].target_role);
    console.log("Mensaje de bienvenida:", roleAgents[0].welcome_message);
    console.log("=== FIN getUserPreferredAgent ===");
    return roleAgents[0];
  } else {
    console.log(
      "No se encontró agente para rol específico, buscando agente compatible con ambos roles"
    );

    // PRIORIDAD 5: Si no hay agentes para el rol específico, buscar uno con target_role="both"
    const { data: bothAgents, error: bothError } = await supabase
      .from("agents")
      .select("*")
      .eq("is_active", true)
      .eq("target_role", "both")
      .order("created_at", { ascending: false })
      .limit(1);

    if (bothError) {
      console.error(
        "Error al buscar agentes compatibles con ambos roles:",
        bothError
      );
    } else if (bothAgents && bothAgents.length > 0) {
      console.log(
        "Agente encontrado compatible con ambos roles:",
        bothAgents[0].name
      );
      console.log("Rol objetivo del agente:", bothAgents[0].target_role);
      console.log("Mensaje de bienvenida:", bothAgents[0].welcome_message);
      console.log("=== FIN getUserPreferredAgent ===");
      return bothAgents[0];
    }
  }

  // PRIORIDAD 6: Si todo lo demás falla, buscar cualquier agente activo
  console.log("Buscando cualquier agente activo");

  const { data: anyAgents, error: anyError } = await supabase
    .from("agents")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (anyError) {
    console.error("Error al buscar cualquier agente:", anyError);
  } else if (anyAgents && anyAgents.length > 0) {
    console.log("Encontrado cualquier agente activo:", anyAgents[0].name);
    console.log("Mensaje de bienvenida:", anyAgents[0].welcome_message);
    console.log("=== FIN getUserPreferredAgent ===");
    return anyAgents[0];
  }

  console.log("No se encontró ningún agente compatible");
  console.log("=== FIN getUserPreferredAgent ===");
  return null;
}
