"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getPrequoteData(sessionId: string, userId: string) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from("prequotes")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Silenciosamente manejamos el error
      return null;
    }

    return data;
  } catch {
    // Silenciosamente manejamos cualquier error
    return null;
  }
}

export async function hasPrequoteData(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from("prequotes")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Silenciosamente manejamos el error
      return false;
    }

    return !!data;
  } catch {
    // Silenciosamente manejamos cualquier error
    return false;
  }
}
