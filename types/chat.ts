export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatResponse {
  output: string;
  response?: string;
}

export interface WebhookRequest {
  sessionId: string;
  action: string;
  chatInput: string;
}
