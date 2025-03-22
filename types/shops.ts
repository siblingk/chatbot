export interface Shop {
  id: string;
  name: string;
  location: string;
  rating: number;
  status: "active" | "inactive";
  rate: number;
  labor_tax_percentage: number;
  parts_tax_percentage: number;
  misc_tax_percentage: number;
  organization_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

type ShopFormData = Omit<Shop, "id" | "created_at" | "updated_at">;

export type ShopActionState = {
  errors?: {
    [key: string]: string[];
  };
  message?: string;
};
