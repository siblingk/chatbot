"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AppRole } from "@/types/auth";
import { redirect } from "next/navigation";

export async function getUserRole(): Promise<{
  role: AppRole | null;
  isAdmin: boolean;
}> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return { role: null, isAdmin: false };
    }

    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return { role: null, isAdmin: false };
    }

    return {
      role: userData?.role || null,
      isAdmin: userData?.role === "admin",
    };
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return { role: null, isAdmin: false };
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

export async function signOut() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/");
}

export async function getUser() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user || null;
}
