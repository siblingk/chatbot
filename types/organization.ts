type OrganizationRole = "super_admin" | "admin" | "colaborador" | "user";

interface Organization {
  id: string;
  name: string;
  slug: string;
  address?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  rating?: number;
  status: "active" | "inactive";
  organization_id: string;
  user_id?: string;
  rate?: number;
  labor_tax_percentage?: number;
  parts_tax_percentage?: number;
  misc_tax_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationWithRole extends Organization {
  role: OrganizationRole;
}

export interface UserShopAccess {
  id: string;
  user_id: string;
  shop_id: string;
  can_view: boolean;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}
