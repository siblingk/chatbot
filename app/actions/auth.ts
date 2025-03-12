"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AppRole } from "@/types/auth";
import { redirect } from "next/navigation";

export async function getUserRole(): Promise<{
  role: AppRole | null;
  isAdmin: boolean;
  isShop: boolean;
}> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data.user?.id) {
      console.log("No user found:", userError?.message);
      return { role: null, isAdmin: false, isShop: false };
    }

    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return { role: null, isAdmin: false, isShop: false };
    }

    return {
      role: userData?.role || null,
      isAdmin: userData?.role === "admin",
      isShop: userData?.role === "shop",
    };
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return { role: null, isAdmin: false, isShop: false };
  }
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
