"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AppRole } from "@/types/auth";
import { redirect } from "next/navigation";

/**
 * Obtiene el rol del usuario actual
 */
export async function getUserRole(): Promise<{ role: AppRole | null }> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { role: null };
  }

  // Obtener el rol directamente de la tabla users
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (error || !user) {
    console.error("Error al obtener el rol del usuario:", error);
    return { role: null };
  }

  // Por defecto, el usuario es un usuario normal
  return { role: user.role };
}

/**
 * Asigna un rol a un usuario
 */
export async function assignUserRole(
  userId: string,
  role: AppRole
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Verificar si el usuario actual es administrador
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser?.user) {
    return { success: false, error: "No autenticado" };
  }

  // Verificar si el usuario actual es administrador
  const isAdmin = await isUserAdmin(currentUser.user.id);
  if (!isAdmin) {
    return { success: false, error: "No tienes permisos para asignar roles" };
  }

  // Actualizar el rol del usuario en la tabla users
  const { error } = await supabase
    .from("users")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error al asignar rol:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

/**
 * Elimina un rol de un usuario (establece el rol a "user")
 */
export async function removeUserRole(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Verificar si el usuario actual es administrador
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser?.user) {
    return { success: false, error: "No autenticado" };
  }

  // Verificar si el usuario actual es administrador
  const isAdmin = await isUserAdmin(currentUser.user.id);
  if (!isAdmin) {
    return { success: false, error: "No tienes permisos para eliminar roles" };
  }

  // Establecer el rol del usuario a "user"
  const { error } = await supabase
    .from("users")
    .update({
      role: "user",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error al eliminar rol:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

/**
 * Obtiene el rol de un usuario
 */
export async function getUserRoles(
  userId: string
): Promise<{ roles: AppRole[] }> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("Error al obtener roles:", error);
    return { roles: [] };
  }

  // Devolvemos el rol como un array para mantener la compatibilidad
  return { roles: [data.role as AppRole] };
}

/**
 * Verifica si un usuario es administrador
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("Error al verificar si es admin:", error);
    return false;
  }

  return data.role === "admin";
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithGoogle() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { url: data.url };
}

export async function signOut() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/");
}

export async function getUser() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }

  return data.user || null;
}
