export interface Message {
  id: string;
  session_id?: string;
  input?: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  user_id?: string;
  output?: string;
  title?: string;
}

export interface ChatResponse {
  output: string;
  response?: string;
}

export interface WebhookRequest {
  sessionId: string;
  action: string;
  chatInput: string;
  userId?: string; // ID del usuario autenticado (opcional)
  agentId?: string; // ID del agente (opcional)
  prompt?: Record<string, unknown>; // Información del agente y parámetros de URL
  // Ya no enviamos estos campos en el cuerpo del webhook
  // userRole?: string; // Rol del usuario (opcional)
  // isAdmin?: boolean; // Indica si el usuario es administrador (opcional)
}

export type ChatStatus =
  | "initial"
  | "prequote"
  | "appointment"
  | "quote"
  | "invoice";

export interface ChatLead {
  id: string;
  session_id: string;
  user_id: string;
  status: ChatStatus;

  // PreQuote information
  prequote_data?: Record<string, unknown>;
  prequote_date?: Date;

  // Appointment information
  appointment_data?: Record<string, unknown>;
  appointment_date?: Date;

  // Quote information
  quote_data?: Record<string, unknown>;
  quote_count?: number;
  last_quote_date?: Date;

  // Invoice information
  invoice_data?: Record<string, unknown>;
  invoice_date?: Date;

  created_at: Date;
  updated_at: Date;
}
