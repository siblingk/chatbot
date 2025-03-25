export interface Agent {
  id: string;
  name: string;
  model: string;
  welcome_message?: string;
  system_instructions?: string;
  is_active: boolean;
  target_role:
    | "user"
    | "shop"
    | "both"
    | "admin"
    | "super_admin"
    | "general_lead";
  created_at: string;
  updated_at: string;
  user_id: string;
  visibility: "public" | "private";
  personality_tone?: string;
  lead_strategy?: string;
  pre_quote_message?: string;
  pre_quote_type?: string;
  expiration_time?: string;
  auto_assign_leads?: boolean;
  auto_respond?: boolean;
  target_agent_id?: string | null;
  documentation?: string | null;
}
