"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Setting, SettingFormData } from "@/types/settings";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema de validación para los formularios
const settingSchema = z.object({
  workshop_id: z.string().min(1, "El ID del taller es obligatorio"),
  workshop_name: z.string().min(1, "El nombre del taller es obligatorio"),
  welcome_message: z.string().min(1, "El mensaje de bienvenida es obligatorio"),
  interaction_tone: z.string().min(1, "El tono de interacción es obligatorio"),
  pre_quote_message: z
    .string()
    .min(1, "El mensaje pre-cotización es obligatorio"),
  contact_required: z.boolean(),
  lead_assignment_mode: z.enum(["automatic", "manual"]),
  follow_up_enabled: z.boolean(),
  price_source: z.enum(["ai", "dcitelly_api"]),
  template_id: z.string().nullable().optional(),
});

export type ActionState = {
  errors?: {
    [key: string]: string[];
  };
  message?: string;
};

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

export async function getSetting(id: string | number): Promise<Setting | null> {
  console.log("getSetting recibió ID:", id, "Tipo:", typeof id);

  // Validar que el ID no sea nulo o vacío
  if (!id) {
    console.error("ID nulo o vacío para obtener:", id);
    return null;
  }

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    console.log("Intentando obtener setting con ID:", id);
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error al obtener setting:", error);
      return null;
    }

    return data as Setting;
  } catch (error) {
    console.error("Error inesperado al obtener setting:", error);
    return null;
  }
}

// Acción mejorada para crear configuraciones
export async function createSettingAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Validar los datos del formulario
  const validatedFields = settingSchema.safeParse({
    workshop_id: formData.get("workshop_id"),
    workshop_name: formData.get("workshop_name"),
    welcome_message: formData.get("welcome_message"),
    interaction_tone: formData.get("interaction_tone"),
    pre_quote_message: formData.get("pre_quote_message"),
    contact_required: formData.get("contact_required") === "true",
    lead_assignment_mode: formData.get("lead_assignment_mode"),
    follow_up_enabled: formData.get("follow_up_enabled") === "true",
    price_source: formData.get("price_source"),
    template_id: formData.get("template_id") || null,
  });

  // Si hay errores de validación, retornarlos
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los datos del formulario",
    };
  }

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { error } = await supabase
      .from("settings")
      .insert([validatedFields.data]);

    if (error) {
      return {
        message: `Error al crear la configuración: ${error.message}`,
      };
    }

    revalidatePath("/settings");
    return { message: "Configuración creada con éxito" };
  } catch (error) {
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

// Acción mejorada para actualizar configuraciones
export async function updateSettingAction(
  id: string | number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  console.log("updateSettingAction recibió ID:", id, "Tipo:", typeof id);

  // Validar que el ID no sea nulo o vacío
  if (!id) {
    console.error("ID nulo o vacío para actualizar:", id);
    return {
      message: "ID inválido para actualizar",
    };
  }

  // Validar los datos del formulario
  const validatedFields = settingSchema.safeParse({
    workshop_id: formData.get("workshop_id"),
    workshop_name: formData.get("workshop_name"),
    welcome_message: formData.get("welcome_message"),
    interaction_tone: formData.get("interaction_tone"),
    pre_quote_message: formData.get("pre_quote_message"),
    contact_required: formData.get("contact_required") === "true",
    lead_assignment_mode: formData.get("lead_assignment_mode"),
    follow_up_enabled: formData.get("follow_up_enabled") === "true",
    price_source: formData.get("price_source"),
    template_id: formData.get("template_id") || null,
  });

  // Si hay errores de validación, retornarlos
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los datos del formulario",
    };
  }

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    console.log("Intentando actualizar setting con ID:", id);
    const { error } = await supabase
      .from("settings")
      .update(validatedFields.data)
      .eq("id", id);

    if (error) {
      console.error("Error al actualizar setting:", error);
      return {
        message: `Error al actualizar la configuración: ${error.message}`,
      };
    }

    revalidatePath("/settings");
    return { message: "Configuración actualizada con éxito" };
  } catch (error) {
    console.error("Error inesperado al actualizar:", error);
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

// Acción mejorada para eliminar configuraciones
export async function deleteSettingAction(
  id: string | number
): Promise<ActionState> {
  console.log("deleteSettingAction recibió ID:", id, "Tipo:", typeof id);

  // Validar que el ID no sea nulo o vacío
  if (!id) {
    console.error("ID nulo o vacío para eliminar:", id);
    return {
      message: "ID inválido para eliminar",
    };
  }

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    console.log("Intentando eliminar setting con ID:", id);
    const { error } = await supabase.from("settings").delete().eq("id", id);

    if (error) {
      console.error("Error al eliminar setting:", error);
      return {
        message: `Error al eliminar la configuración: ${error.message}`,
      };
    }

    revalidatePath("/settings");
    return { message: "Configuración eliminada con éxito" };
  } catch (error) {
    console.error("Error inesperado al eliminar:", error);
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

// Mantener las funciones antiguas para compatibilidad
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
  id: string | number,
  formData: SettingFormData
): Promise<{ success: boolean; error?: string }> {
  console.log("updateSetting recibió ID:", id, "Tipo:", typeof id);

  // Si es un UUID válido o un string no vacío, proceder
  if (id && typeof id === "string" && id.trim() !== "") {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    console.log("Intentando actualizar con ID:", id);
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

  // Si es un número, intentar convertirlo a string
  if (typeof id === "number" && !isNaN(id)) {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    console.log("Intentando actualizar con ID numérico:", id);
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

  console.error("ID inválido para actualizar:", id);
  return { success: false, error: "ID inválido" };
}

export async function deleteSetting(
  id: string | number
): Promise<{ success: boolean; error?: string }> {
  console.log("deleteSetting recibió ID:", id, "Tipo:", typeof id);

  // Si es un UUID válido o un string no vacío, proceder
  if (id && typeof id === "string" && id.trim() !== "") {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    console.log("Intentando eliminar con ID:", id);
    const { error } = await supabase.from("settings").delete().eq("id", id);

    if (error) {
      console.error("Error deleting setting:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true };
  }

  // Si es un número, intentar convertirlo a string
  if (typeof id === "number" && !isNaN(id)) {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    console.log("Intentando eliminar con ID numérico:", id);
    const { error } = await supabase.from("settings").delete().eq("id", id);

    if (error) {
      console.error("Error deleting setting:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true };
  }

  console.error("ID inválido para eliminar:", id);
  return { success: false, error: "ID inválido" };
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
