"use server";

import { createClient } from "@/utils/supabase/server";
import { Setting, SettingFormData } from "@/types/settings";
import { revalidatePath } from "next/cache";

export async function getSettings(): Promise<Setting[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .order("workshop_name");

  if (error) {
    console.error("Error fetching settings:", error);
    throw new Error("Error fetching settings");
  }

  return data;
}

export async function getSetting(id: string): Promise<Setting | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching setting:", error);
    return null;
  }

  return data;
}

export async function createSetting(formData: SettingFormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("settings").insert([formData]);

  if (error) {
    console.error("Error creating setting:", error);
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateSetting(
  id: string,
  formData: Partial<SettingFormData>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("settings")
    .update(formData)
    .eq("id", id);

  if (error) {
    console.error("Error updating setting:", error);
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteSetting(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("settings").delete().eq("id", id);

  if (error) {
    console.error("Error deleting setting:", error);
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function getWelcomeMessage(workshopId?: string): Promise<string> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("settings")
    .select("welcome_message")
    .eq("workshop_id", workshopId || "0000")
    .maybeSingle();

  return data?.welcome_message;
}
