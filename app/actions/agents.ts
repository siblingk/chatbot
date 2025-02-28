"use server";
import { cookies } from "next/headers";
import { Agent } from "@/types/agents";
import { createClient } from "@/utils/supabase/server";

export async function getAgents() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: agents, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching agents:", error);
    throw error;
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
    user_id: user.id, // Usar el ID del usuario autenticado
  };

  const { error } = await supabase.from("agents").upsert(agentData);

  if (error) {
    console.error("Error updating agent:", error);
    throw error;
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
