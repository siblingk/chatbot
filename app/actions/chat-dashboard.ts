"use server";

import { createClient } from "@/utils/supabase/server";
import { ChatDashboardOption } from "@/types/chat";
import { cookies } from "next/headers";

/**
 * Obtiene todas las opciones del dashboard de chat
 * @returns Un array con todas las opciones disponibles ordenadas por order_index
 */
export async function getChatDashboardOptions(): Promise<
  ChatDashboardOption[]
> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data, error } = await supabase
      .from("chat_dashboard_options")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error al obtener opciones del dashboard:", error.message);
      return [];
    }

    return data as ChatDashboardOption[];
  } catch (error) {
    console.error("Error inesperado al obtener opciones del dashboard:", error);
    return [];
  }
}

/**
 * Envía un mensaje utilizando la opción seleccionada del dashboard
 * @param sessionId ID de la sesión de chat
 * @param optionId ID de la opción seleccionada
 * @returns Objeto con el resultado de la operación
 */
export async function sendDashboardOptionMessage(
  sessionId: string,
  optionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Obtener la opción seleccionada
    const { data: option, error: optionError } = await supabase
      .from("chat_dashboard_options")
      .select("*")
      .eq("id", optionId)
      .single();

    if (optionError || !option) {
      console.error(
        "Error al obtener la opción seleccionada:",
        optionError?.message
      );
      return {
        success: false,
        message: "No se pudo encontrar la opción seleccionada",
      };
    }

    // En un sistema real, aquí se implementaría la lógica para enviar el mensaje al sistema de chat
    // y obtener una respuesta personalizada. Por ahora, simplemente devolvemos el texto predefinido.

    return {
      success: true,
      message: option.response_text || "Opción seleccionada con éxito",
    };
  } catch (error) {
    console.error("Error al enviar mensaje de opción de dashboard:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado al procesar la opción seleccionada",
    };
  }
}
