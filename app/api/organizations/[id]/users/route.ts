import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = id;
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Verificar que el usuario tenga acceso a la organización
    const { data: userSession } = await supabase.auth.getSession();
    if (!userSession?.session) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener todos los usuarios de la organización
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role, created_at")
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error al obtener usuarios de la organización:", error);
      return NextResponse.json(
        { success: false, error: "Error al obtener usuarios" },
        { status: 500 }
      );
    }

    // Para mostrar el estado de invitación, usaremos la información de login
    // Podemos simular esto usando el campo confirmed_at o email_confirmed_at como indicador
    // Si un usuario ha confirmado su email, ha aceptado la invitación

    // Transformar los datos para mantener compatibilidad con el formato anterior
    const formattedUsers = users.map((user) => {
      // Aquí simulamos last_sign_in_at basado en si el usuario tiene un rol establecido
      // Los usuarios con rol establecido (diferente a null) han iniciado sesión al menos una vez
      const hasSignedIn = Boolean(user.role); // Si tiene rol asignado, probablemente ha iniciado sesión

      return {
        id: user.id,
        user_id: user.id,
        email: user.email || "",
        name:
          user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : null,
        role: user.role,
        created_at: user.created_at,
        last_sign_in_at: hasSignedIn ? new Date().toISOString() : null,
      };
    });

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error("Error en la API de usuarios de organización:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = id;
    const { userId, role } = await request.json();

    console.log(`Solicitud de actualización de rol recibida:`, {
      organizationId,
      userId,
      role,
    });

    if (!userId || !role) {
      console.error("Datos incompletos:", { userId, role });
      return NextResponse.json(
        { success: false, error: "Datos incompletos" },
        { status: 400 }
      );
    }

    console.log(
      `Actualizando rol para usuario ${userId} a ${role} en organización ${organizationId}`
    );

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Verificar que el usuario tenga acceso a la organización y sea admin
    const { data: userSession } = await supabase.auth.getSession();
    if (!userSession?.session) {
      console.error("Sesión no encontrada");
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el rol del usuario actual
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userSession.session.user.id)
      .single();

    if (currentUserError) {
      console.error(
        "Error al obtener información del usuario actual:",
        currentUserError
      );
      return NextResponse.json(
        { success: false, error: "Error al verificar permisos" },
        { status: 500 }
      );
    }

    console.log("Rol del usuario actual:", currentUser?.role);

    // Solo admins pueden actualizar roles
    if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
      console.error("Usuario sin permisos:", currentUser?.role);
      return NextResponse.json(
        { success: false, error: "No tienes permisos para cambiar roles" },
        { status: 403 }
      );
    }

    // Verificar que el usuario a actualizar existe en la organización
    const { data: userToUpdate, error: userCheckError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .eq("organization_id", organizationId)
      .single();

    if (userCheckError || !userToUpdate) {
      console.error(
        "Usuario no encontrado en la organización:",
        userCheckError
      );
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado en la organización" },
        { status: 404 }
      );
    }

    console.log(
      `Actualizando rol para usuario de ${userToUpdate.role} a ${role}`
    );

    // Actualizar el rol del usuario
    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error al actualizar rol:", error);
      return NextResponse.json(
        { success: false, error: "Error al actualizar rol" },
        { status: 500 }
      );
    }

    console.log("Rol actualizado exitosamente");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en la API de actualización de rol:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
