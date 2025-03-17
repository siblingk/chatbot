"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * Asigna el rol de administrador al primer usuario que se registre
 * Esta función se debe llamar después de que un usuario se registre
 */
export async function setupFirstUser(): Promise<{
  success: boolean;
  error?: string;
}> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Obtener el usuario actual
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { success: false, error: "No hay usuario autenticado" };
  }

  // Verificar si hay usuarios en la tabla user_roles
  const { count, error: countError } = await supabase
    .from("user_roles")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Error al contar usuarios:", countError);
    return { success: false, error: countError.message };
  }

  // Si no hay usuarios, asignar el rol de administrador al usuario actual
  if (count === 0) {
    const { error: insertError } = await supabase.from("user_roles").insert({
      user_id: userData.user.id,
      role: "admin",
    });

    if (insertError) {
      console.error("Error al asignar rol de administrador:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  }

  return { success: false, error: "Ya existe un administrador en el sistema" };
}
