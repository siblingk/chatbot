export type OrganizationRole = "admin" | "collaborator" | "member";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  shops: Shop[];
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  name: string;
  organization_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationWithRole extends Organization {
  role: OrganizationRole;
}
