"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  status: "active" | "inactive";
}

export type ActionState = {
  errors?: {
    [key: string]: string[];
  };
  message?: string;
};

// Schema de validación para los formularios de usuarios
const userSchema = z.object({
  email: z.string().email("El correo electrónico no es válido"),
  role: z.enum(["user", "admin"], {
    errorMap: () => ({ message: "El rol debe ser 'user' o 'admin'" }),
  }),
});

export async function getUsers(): Promise<User[]> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    // Primero intentamos obtener los datos con last_sign_in_at y status
    const query = supabase
      .from("users")
      .select("id, email, role, created_at, last_sign_in_at, status")
      .order("created_at", { ascending: false });

    const { data: initialData, error } = await query;

    // Si hay un error específico sobre la columna last_sign_in_at
    if (error && error.message.includes("last_sign_in_at")) {
      console.warn(
        "Columna last_sign_in_at no encontrada, usando consulta alternativa"
      );

      // Intentamos de nuevo sin la columna problemática
      const result = await supabase
        .from("users")
        .select("id, email, role, created_at, status")
        .order("created_at", { ascending: false });

      if (result.error) {
        console.error("Error en consulta alternativa:", result.error);
        return [];
      }

      // Añadimos un valor nulo para last_sign_in_at
      const data = result.data.map((user) => ({
        ...user,
        last_sign_in_at: null,
      }));

      return data;
    } else if (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    }

    return initialData || [];
  } catch (error) {
    console.error("Error en getUsers:", error);
    return [];
  }
}

// Acción mejorada para crear/invitar usuarios
export async function createUserAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Validar los datos del formulario
  const validatedFields = userSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
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
    // Invitar al usuario a través de la API de Supabase
    console.log("Invitando usuario:", validatedFields.data);

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      validatedFields.data.email,
      {
        data: {
          role: validatedFields.data.role,
        },
      }
    );

    if (error) {
      console.error("Error al invitar usuario:", error);
      return {
        message: `Error al invitar usuario: ${error.message}`,
      };
    }

    // Asegurarse de que el usuario tenga el estado activo
    if (data && data.user) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          role: validatedFields.data.role,
          status: "active",
        })
        .eq("id", data.user.id);

      if (updateError) {
        console.error("Error al actualizar estado del usuario:", updateError);
      }
    }

    revalidatePath("/settings");
    return { message: "Usuario invitado con éxito" };
  } catch (error) {
    console.error("Error en createUserAction:", error);
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

// Acción mejorada para actualizar usuarios
export async function updateUserAction(
  userId: string | number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  console.log("updateUserAction recibió ID:", userId, "Tipo:", typeof userId);

  // Validar que el ID no sea nulo o vacío
  if (!userId) {
    console.error("ID nulo o vacío para actualizar:", userId);
    return {
      message: "ID inválido para actualizar",
    };
  }

  // Validar los datos del formulario
  const validatedFields = userSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
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
    // Actualizar el usuario en la base de datos
    console.log("Actualizando usuario:", userId, validatedFields.data);

    const { error } = await supabase
      .from("users")
      .update({
        email: validatedFields.data.email,
        role: validatedFields.data.role,
        // Mantenemos el status actual
      })
      .eq("id", userId);

    if (error) {
      console.error("Error al actualizar usuario:", error);
      return {
        message: `Error al actualizar el usuario: ${error.message}`,
      };
    }

    revalidatePath("/settings");
    return { message: "Usuario actualizado con éxito" };
  } catch (error) {
    console.error("Error inesperado al actualizar usuario:", error);
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

// Acción mejorada para desactivar usuarios (reemplaza a deleteUserAction)
export async function deactivateUserAction(
  userId: string | number
): Promise<ActionState> {
  console.log(
    "deactivateUserAction recibió ID:",
    userId,
    "Tipo:",
    typeof userId
  );

  // Validar que el ID no sea nulo o vacío
  if (!userId) {
    console.error("ID nulo o vacío para desactivar:", userId);
    return {
      message: "ID inválido para desactivar",
    };
  }

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    console.log("Intentando desactivar usuario con ID:", userId);
    const { error } = await supabase
      .from("users")
      .update({ status: "inactive" })
      .eq("id", userId);

    if (error) {
      console.error("Error al desactivar usuario:", error);
      return {
        message: `Error al desactivar el usuario: ${error.message}`,
      };
    }

    revalidatePath("/settings");
    return { message: "Usuario desactivado con éxito" };
  } catch (error) {
    console.error("Error inesperado al desactivar usuario:", error);
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

// Mantener la función antigua para compatibilidad pero ahora desactiva en lugar de eliminar
export async function deleteUser(
  userId: string | number
): Promise<{ success: boolean; error?: string }> {
  console.log("deleteUser recibió ID:", userId, "Tipo:", typeof userId);

  // Validar que el ID no sea nulo o vacío
  if (!userId) {
    console.error("ID nulo o vacío para desactivar:", userId);
    return { success: false, error: "ID inválido para desactivar" };
  }

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    console.log("Intentando desactivar usuario con ID:", userId);
    const { error } = await supabase
      .from("users")
      .update({ status: "inactive" })
      .eq("id", userId);

    if (error) {
      console.error("Error desactivando usuario:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al desactivar el usuario",
    };
  }
}

// Función para reactivar usuarios
export async function activateUserAction(
  userId: string | number
): Promise<ActionState> {
  console.log("activateUserAction recibió ID:", userId, "Tipo:", typeof userId);

  // Validar que el ID no sea nulo o vacío
  if (!userId) {
    console.error("ID nulo o vacío para activar:", userId);
    return {
      message: "ID inválido para activar",
    };
  }

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    console.log("Intentando activar usuario con ID:", userId);
    const { error } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", userId);

    if (error) {
      console.error("Error al activar usuario:", error);
      return {
        message: `Error al activar el usuario: ${error.message}`,
      };
    }

    revalidatePath("/settings");
    return { message: "Usuario activado con éxito" };
  } catch (error) {
    console.error("Error inesperado al activar usuario:", error);
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

// Función para cambiar el rol del usuario
export async function toggleUserRoleAction(
  userId: string | number
): Promise<ActionState> {
  console.log(
    "toggleUserRoleAction recibió ID:",
    userId,
    "Tipo:",
    typeof userId
  );

  // Validar que el ID no sea nulo o vacío
  if (!userId) {
    console.error("ID nulo o vacío para cambiar rol:", userId);
    return {
      message: "ID inválido para cambiar rol",
    };
  }

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    // Primero obtenemos el rol actual del usuario
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (fetchError || !userData) {
      console.error("Error al obtener el rol del usuario:", fetchError);
      return {
        message: `Error al obtener el rol del usuario: ${
          fetchError?.message || "Usuario no encontrado"
        }`,
      };
    }

    // Determinamos el nuevo rol (inverso al actual)
    const newRole = userData.role === "admin" ? "user" : "admin";

    // Actualizamos el rol del usuario
    console.log(
      `Cambiando rol de usuario ${userId} de ${userData.role} a ${newRole}`
    );
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("Error al cambiar el rol del usuario:", error);
      return {
        message: `Error al cambiar el rol del usuario: ${error.message}`,
      };
    }

    revalidatePath("/settings");
    return {
      message:
        newRole === "admin"
          ? "Permisos de administrador concedidos"
          : "Permisos de administrador removidos",
    };
  } catch (error) {
    console.error("Error inesperado al cambiar el rol del usuario:", error);
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}
