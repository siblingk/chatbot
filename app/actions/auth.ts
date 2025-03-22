"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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
