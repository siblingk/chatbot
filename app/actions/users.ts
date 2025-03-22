"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AppRole } from "@/types/auth";

export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  status: "active" | "inactive";
  is_super_admin?: boolean;
}

type ActionState = {
  errors?: {
    [key: string]: string[];
  };
  message?: string;
  success?: boolean;
  data?: User[];
};

/**
 * Obtiene la lista de todos los usuarios
 */
export async function getUsersAction(): Promise<ActionState> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Verificar si el usuario actual tiene permisos
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { success: false, message: "No autorizado", data: [] };
    }

    // Obtener el usuario actual
    const { data: currentUser } = await supabase
      .from("users")
      .select("role, is_super_admin")
      .eq("id", session.session.user.id)
      .single();

    // Solo los administradores pueden ver todos los usuarios
    if (
      !currentUser?.is_super_admin &&
      currentUser?.role !== "admin" &&
      currentUser?.role !== "super_admin" &&
      currentUser?.role !== "colaborador"
    ) {
      return { success: false, message: "No autorizado", data: [] };
    }

    // Obtener todos los usuarios
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, email, role, last_sign_in_at, created_at, updated_at, status, is_super_admin"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener usuarios:", error);
      return { success: false, message: "Error al obtener usuarios", data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Error inesperado", data: [] };
  }
}

/**
 * Función compatible con versiones anteriores para obtener la lista de usuarios
 */
export async function getUsers(): Promise<User[]> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return [];
    }

    // Obtener todos los usuarios
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, email, role, created_at, last_sign_in_at, status, is_super_admin"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error en getUsers:", error);
    return [];
  }
}

/**
 * Crea un nuevo usuario
 */
export async function createUserAction({
  email,
  role = "user",
}: {
  email: string;
  role?: AppRole;
}): Promise<ActionState> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Verificar si el usuario actual tiene permisos
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { success: false, message: "No autorizado" };
    }

    // Obtener el usuario actual
    const { data: currentUser } = await supabase
      .from("users")
      .select("role, is_super_admin")
      .eq("id", session.session.user.id)
      .single();

    // Solo los administradores pueden crear usuarios
    if (
      !currentUser?.is_super_admin &&
      currentUser?.role !== "admin" &&
      currentUser?.role !== "super_admin"
    ) {
      return { success: false, message: "No autorizado" };
    }

    // Sólo un super_admin puede crear otro super_admin
    if (
      role === "super_admin" &&
      !currentUser.is_super_admin &&
      currentUser.role !== "super_admin"
    ) {
      return {
        success: false,
        message:
          "Solo los super administradores pueden crear otros super administradores",
      };
    }

    // Validación
    if (!email) {
      return { success: false, message: "Email requerido" };
    }

    // Comprobar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return { success: false, message: "El usuario ya existe" };
    }

    // Crear usuario en Supabase Auth
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      password: generateRandomPassword(12),
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { role },
    });

    if (error) {
      console.error("Error al crear usuario:", error);
      return { success: false, message: error.message };
    }

    // Actualizar el rol y is_super_admin en la tabla users si es necesario
    const updateData: { role?: AppRole; is_super_admin?: boolean } = {};

    // Si el rol no es user o el trigger no lo manejó correctamente
    if (role !== "user") {
      updateData.role = role;
    }

    // Actualizar is_super_admin si es super_admin
    if (role === "super_admin") {
      updateData.is_super_admin = true;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", newUser.user.id);

      if (updateError) {
        console.error("Error al actualizar usuario:", updateError);
        // No fallamos la operación porque el usuario ya fue creado
      }
    }

    revalidatePath("/settings");
    return { success: true, message: "Usuario creado exitosamente" };
  } catch (error) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Error inesperado" };
  }
}

/**
 * Actualiza un usuario existente
 */
export async function updateUserAction({
  id,
  role,
}: {
  id: string;
  role?: AppRole;
}): Promise<ActionState> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Verificar si el usuario actual tiene permisos
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { success: false, message: "No autorizado" };
    }

    // Obtener el usuario actual
    const { data: currentUser } = await supabase
      .from("users")
      .select("role, is_super_admin")
      .eq("id", session.session.user.id)
      .single();

    // Solo los administradores pueden actualizar usuarios
    if (
      !currentUser?.is_super_admin &&
      currentUser?.role !== "admin" &&
      currentUser?.role !== "super_admin"
    ) {
      return { success: false, message: "No autorizado" };
    }

    // Validación
    if (!id) {
      return { success: false, message: "ID de usuario requerido" };
    }

    // Verificar que el usuario existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (!existingUser) {
      return { success: false, message: "Usuario no encontrado" };
    }

    // Si el usuario a editar es super_admin y el usuario actual no es super_admin
    if (
      existingUser.role === "super_admin" &&
      !currentUser.is_super_admin &&
      currentUser.role !== "super_admin"
    ) {
      return {
        success: false,
        message: "No tienes permiso para editar a un super administrador",
      };
    }

    // Actualizar el usuario
    const updateData: { role?: AppRole; is_super_admin?: boolean } = {};
    if (role) {
      updateData.role = role;

      // Actualizar is_super_admin en caso de asignar/quitar el rol super_admin
      if (role === "super_admin") {
        updateData.is_super_admin = true;
      } else if (existingUser.role === "super_admin") {
        updateData.is_super_admin = false;
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error("Error al actualizar usuario:", updateError);
        return { success: false, message: updateError.message };
      }
    }

    // También actualizar metadatos del usuario en auth.users
    if (role) {
      const { error: authUpdateError } =
        await supabase.auth.admin.updateUserById(id, {
          app_metadata: { role },
          user_metadata: { role },
        });

      if (authUpdateError) {
        console.error(
          "Error al actualizar metadatos del usuario:",
          authUpdateError
        );
        // No fallamos la operación si sólo falló la actualización de metadatos
      }
    }

    revalidatePath("/settings");
    return { success: true, message: "Usuario actualizado exitosamente" };
  } catch (error) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Error inesperado" };
  }
}

/**
 * Genera una contraseña aleatoria segura con la longitud especificada
 */
function generateRandomPassword(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let password = "";

  // Asegurar que hay al menos una mayúscula, una minúscula, un número y un carácter especial
  password += chars.charAt(Math.floor(Math.random() * 26)); // mayúscula
  password += chars.charAt(26 + Math.floor(Math.random() * 26)); // minúscula
  password += chars.charAt(52 + Math.floor(Math.random() * 10)); // número
  password += chars.charAt(62 + Math.floor(Math.random() * 14)); // especial

  // Completar el resto de la contraseña aleatoriamente
  for (let i = 4; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Mezclar los caracteres
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}
