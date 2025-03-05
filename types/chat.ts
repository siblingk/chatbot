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
}
