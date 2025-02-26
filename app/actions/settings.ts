"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Setting, SettingFormData } from "@/types/settings";
import { revalidatePath } from "next/cache";

export async function getSettings(): Promise<Setting[]> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching settings:", error);
    return [];
  }

  return data as Setting[];
}

export async function getSetting(id: number): Promise<Setting | null> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching setting:", error);
    return null;
  }

  return data as Setting;
}

export async function createSetting(
  formData: SettingFormData
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { error } = await supabase.from("settings").insert([formData]);

  if (error) {
    console.error("Error creating setting:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateSetting(
  id: number,
  formData: SettingFormData
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { error } = await supabase
    .from("settings")
    .update(formData)
    .eq("id", id);

  if (error) {
    console.error("Error updating setting:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteSetting(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { error } = await supabase.from("settings").delete().eq("id", id);

  if (error) {
    console.error("Error deleting setting:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function getWelcomeMessage(workshopId?: string): Promise<string> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data } = await supabase
    .from("settings")
    .select("welcome_message")
    .eq("workshop_id", workshopId || "0000")
    .maybeSingle();

  return data?.welcome_message;
}

export async function getSettingOptions(): Promise<string[]> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase.from("setting_options").select("*");

  if (error) {
    console.error("Error fetching setting options:", error);
    return [];
  }

  return data.map((option: { name: string }) => option.name);
}
