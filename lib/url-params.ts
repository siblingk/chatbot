import { parseAsString, parseAsJson } from "nuqs";

// Definimos los parámetros de URL para el chat
export const chatParams = {
  // ID del agente para cargar su configuración
  agentId: parseAsString,

  // Configuración del agente en formato JSON (para pruebas sin ID)
  agentConfig: parseAsJson((value) => value as Record<string, unknown>),

  // Parámetros del agente con los nombres exactos de la interfaz Agent
  welcome_message: parseAsString,
  pre_quote_message: parseAsString,
  name: parseAsString,
  model: parseAsString,
  visibility: parseAsString,
  personality_tone: parseAsString,
  lead_strategy: parseAsString,
  pre_quote_type: parseAsString,
  expiration_time: parseAsString,
  system_instructions: parseAsString,
  auto_assign_leads: parseAsString,
  auto_respond: parseAsString,
  user_id: parseAsString,

  // Parámetros adicionales
  initialMessage: parseAsString,
  theme: parseAsString,
  locale: parseAsString,
};
