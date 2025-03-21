export type LeadAssignmentMode = "automatic" | "manual";
export type PriceSource = "ai" | "dcitelly_api" | "manual";
export type ShopStatus = "active" | "inactive";

export interface Setting {
  id: string;
  workshop_id: string;
  workshop_name: string;
  welcome_message: string;
  interaction_tone: string;
  pre_quote_message: string;
  contact_required: boolean;
  lead_assignment_mode: LeadAssignmentMode;
  follow_up_enabled: boolean;
  price_source: PriceSource;
  template_id: string | null;
  location?: string;
  rating?: number;
  status?: ShopStatus;
  rate?: number;
  labor_tax_percentage?: number;
  parts_tax_percentage?: number;
  misc_tax_percentage?: number;
  created_at: string;
  updated_at: string;
}

export type SettingFormData = Omit<Setting, "id" | "created_at" | "updated_at">;
