export type PersonalityTone =
  | "Formal"
  | "Friendly"
  | "Sales-Driven"
  | "Sales-Focused";
export type LeadStrategy = "Strict-Filtering" | "Smart-Targeting";
export type PreQuoteType =
  | "Standard"
  | "With Warranty"
  | "Detailed Explanation"
  | "Special Offer"
  | "Custom";
export type ExpirationTime = "24 Hours" | "3 Hours" | "7 Days" | "Custom";

export interface Agent {
  id: string;
  name: string;
  model: "quote-builder-ai" | "omni-ai";
  visibility: "private" | "public";
  personality_tone: PersonalityTone;
  lead_strategy: LeadStrategy;
  welcome_message: string;
  pre_quote_message: string;
  pre_quote_type: PreQuoteType;
  expiration_time: ExpirationTime;
  system_instructions: string;
  auto_assign_leads: boolean;
  auto_respond: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_active: boolean;
  target_role: "user" | "shop" | "admin" | "both";
  target_agent_id?: string;
}

export interface AgentConfig {
  agents: Agent[];
}
