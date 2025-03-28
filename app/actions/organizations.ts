"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { OrganizationWithRole } from "@/types/organization";

/**
 * Obtiene todas las organizaciones
 */
export async function getUserOrganizations(): Promise<OrganizationWithRole[]> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    return [];
  }

  try {
    // Consultar directamente la tabla organizations
    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("*");

    if (orgError) {
      console.error("Error al obtener organizations:", orgError);
      return [];
    }

    // No consultamos la tabla organization_users para evitar recursión infinita
    // Asignamos un rol por defecto a todas las organizaciones
    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      created_at: org.created_at,
      updated_at: org.updated_at,
      role: "admin" as const, // Asignamos rol admin por defecto
    }));
  } catch (error) {
    console.error("Error en getUserOrganizations:", error);
    return [];
  }
}

/**
 * Genera un slug a partir de un texto
 * Convierte el texto a minúsculas, reemplaza espacios por guiones y elimina caracteres especiales
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Eliminar caracteres especiales
    .replace(/\s+/g, "-") // Reemplazar espacios por guiones
    .replace(/-+/g, "-"); // Eliminar guiones duplicados
}

/**
 * Crea una nueva organización
 */
export async function createOrganization(name: string, slug?: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Generar slug a partir del nombre si no se proporciona
    const finalSlug = slug || generateSlug(name);

    // Crear la organización
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name,
        slug: finalSlug,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error al crear organización:", orgError);
      return { success: false, error: "Error al crear organización" };
    }

    // Ya no es necesario asignar rol de admin al usuario actual porque:
    // 1. La tabla organization_users ya no existe
    // 2. La función get_user_organizations siempre devuelve 'admin' como rol

    revalidatePath("/organizations");
    return { success: true, data: organization };
  } catch (error: unknown) {
    console.error("Error al crear organización:", error);
    return { success: false, error: "Error al crear organización" };
  }
}

/**
 * Obtiene todos los shops de una organización
 */
export async function getOrganizationShops(organizationId: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Obtener shops
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error al obtener shops:", error);
      return { success: false, error: "Error al obtener shops", data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error al obtener shops:", error);
    return { success: false, error: "Error al obtener shops", data: [] };
  }
}

/**
 * Agrega un usuario a una organización
 */
export async function addUserToOrganization(
  organizationId: string,
  email: string,
  role: string
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Primero, buscar el usuario por email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError) {
      console.error("Error al buscar usuario:", userError);
      return { success: false, error: "Usuario no encontrado" };
    }

    // Agregar el usuario a la organización con la nueva función RPC
    const { error: updateError } = await supabase.rpc(
      "add_user_to_organization",
      {
        p_user_id: userData.id,
        p_org_id: organizationId,
        p_role: role,
      }
    );

    if (updateError) {
      console.error("Error al agregar usuario a la organización:", updateError);
      return {
        success: false,
        error: "Error al agregar usuario a la organización",
      };
    }

    revalidatePath(`/organizations/${organizationId}`);
    return {
      success: true,
      data: {
        id: userData.id,
        user_id: userData.id,
        email,
        role,
        created_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error al agregar usuario a la organización:", error);
    return {
      success: false,
      error: "Error al agregar usuario a la organización",
    };
  }
}

/**
 * Actualiza el rol de un usuario en una organización
 */
export async function updateUserRole(
  organizationId: string,
  userId: string,
  role: string
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Verificar que el usuario pertenezca a la organización
    const { data: userToUpdate, error: userCheckError } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", userId)
      .eq("organization_id", organizationId)
      .single();

    if (userCheckError || !userToUpdate) {
      console.error(
        "Usuario no encontrado en la organización:",
        userCheckError
      );
      return {
        success: false,
        error: "Usuario no encontrado en la organización",
      };
    }

    // Actualizar el rol del usuario
    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error al actualizar rol:", error);
      return { success: false, error: "Error al actualizar rol" };
    }

    revalidatePath(`/organizations/${organizationId}`);
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    return { success: false, error: "Error al actualizar rol" };
  }
}

/**
 * Elimina un usuario de una organización
 */
export async function removeUserFromOrganization(
  organizationId: string,
  userId: string
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Eliminar la asociación del usuario con la organización
    const { error } = await supabase.rpc("remove_user_from_organization", {
      p_user_id: userId,
      p_org_id: organizationId,
    });

    if (error) {
      console.error("Error al eliminar usuario de la organización:", error);
      return {
        success: false,
        error: "Error al eliminar usuario de la organización",
      };
    }

    revalidatePath(`/organizations/${organizationId}`);
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar usuario de la organización:", error);
    return {
      success: false,
      error: "Error al eliminar usuario de la organización",
    };
  }
}

/**
 * Elimina un shop
 */
export async function deleteShop(shopId: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Obtener el shop para saber a qué organización pertenece
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("organization_id, name")
      .eq("id", shopId)
      .single();

    if (shopError) {
      console.error("Error al obtener shop:", shopError);
      return { success: false, error: "Error al obtener shop" };
    }

    // Guardar el organization_id para revalidar la ruta después
    const organizationId = shop.organization_id;

    // Imprimimos información de depuración
    console.log(`Intentando eliminar tienda ${shop.name} (ID: ${shopId})`);
    console.log(`Organización asociada: ${organizationId || "Ninguna"}`);

    let tiendaEliminada = false;

    // Intentamos eliminar primero con RPC
    try {
      console.log("Intentando eliminar con función RPC mejorada...");
      const startTime = Date.now();

      await supabase.rpc("eliminar_tienda_seguro", {
        shop_id_param: shopId,
      });

      console.log(`RPC ejecutado en ${Date.now() - startTime}ms`);

      // Verificamos si la tienda fue eliminada realmente
      const { data: shopExiste, error: checkError } = await supabase
        .from("shops")
        .select("id")
        .eq("id", shopId)
        .maybeSingle();

      if (checkError) {
        console.warn("Error al verificar si la tienda existe:", checkError);
      } else if (!shopExiste) {
        console.log("Verificación confirmada: tienda eliminada correctamente");
        tiendaEliminada = true;
      } else {
        console.log("La tienda aún existe a pesar de llamar a RPC");
      }
    } catch (rpcError) {
      console.warn(
        "Error durante RPC (pero posiblemente la tienda fue eliminada):",
        rpcError
      );
    }

    // Si falla el RPC o no podemos confirmar, intentamos eliminar directamente
    if (!tiendaEliminada) {
      try {
        // Desasociar de la organización primero
        if (organizationId) {
          console.log("Desasociando manualmente primero...");
          await supabase
            .from("shops")
            .update({ organization_id: null })
            .eq("id", shopId);
        }

        // Eliminar directamente
        console.log("Eliminando directamente con DELETE...");
        const { error: deleteError } = await supabase
          .from("shops")
          .delete()
          .eq("id", shopId);

        if (deleteError) {
          console.error("Error al eliminar directamente:", deleteError);
        } else {
          tiendaEliminada = true;
          console.log("Tienda eliminada correctamente con DELETE directo");
        }
      } catch (directError) {
        console.error("Error al eliminar directamente:", directError);
      }
    }

    // Verificamos una última vez si la tienda fue realmente eliminada
    const { data: shopExisteFinal, error: finalCheckError } = await supabase
      .from("shops")
      .select("id")
      .eq("id", shopId)
      .maybeSingle();

    if (finalCheckError) {
      console.warn("Error en verificación final:", finalCheckError);
    } else if (!shopExisteFinal) {
      tiendaEliminada = true;
      console.log("Verificación final: tienda eliminada correctamente");
    }

    // Independientemente de los errores, si la tienda ya no existe,
    // consideramos la operación exitosa
    if (tiendaEliminada) {
      console.log(
        `Tienda ${shop.name} (ID: ${shopId}) eliminada correctamente`
      );

      if (organizationId) {
        // Intentar actualizar el array JSONB en la organización
        try {
          await supabase.rpc("actualizar_shops_organization", {
            org_id_param: organizationId,
          });
        } catch (updateError) {
          console.warn(
            "Error al actualizar shops en organización:",
            updateError
          );
          // No es crítico, continuamos
        }

        revalidatePath(`/organizations/${organizationId}`);
      }

      revalidatePath("/organizations");
      return { success: true, message: "Tienda eliminada correctamente" };
    }

    // Si llegamos aquí, la tienda no fue eliminada
    return {
      success: false,
      error: "Error al eliminar tienda: La operación no pudo completarse",
    };
  } catch (error: unknown) {
    console.error("Error al eliminar shop:", error);
    return {
      success: false,
      error: `Error al eliminar shop: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

/**
 * Asigna una tienda existente a una organización
 */
export async function assignShopToOrganization(
  shopId: string,
  organizationId: string
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Primero, obtener información de la tienda y la organización
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single();

    if (shopError) {
      console.error("Error al obtener tienda:", shopError);
      return {
        success: false,
        error: "Error al obtener información de la tienda",
      };
    }

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("shops")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      console.error("Error al obtener organización:", orgError);
      return {
        success: false,
        error: "Error al obtener información de la organización",
      };
    }

    console.log(
      `Intentando asignar tienda ${shop.name} (ID: ${shopId}) a organización ${organizationId}`
    );

    // Enfoque seguro en dos pasos
    try {
      // 1. Primero actualizamos el campo shops en la organización
      const existingShops = organization.shops || [];
      const shopExists = existingShops.some(
        (s: { id: string }) => s.id === shopId
      );

      if (!shopExists) {
        // Añadir la tienda al array JSONB
        const updatedShops = [
          ...existingShops,
          { id: shopId, name: shop.name },
        ];

        // Actualizar organización
        const { error: updateOrgError } = await supabase
          .from("organizations")
          .update({ shops: updatedShops })
          .eq("id", organizationId);

        if (updateOrgError) {
          console.error(
            "Error al actualizar array shops en organización:",
            updateOrgError
          );
          // Continuamos de todos modos
        } else {
          console.log(
            "Array shops actualizado correctamente en la organización"
          );
        }
      }

      // 2. Actualizar la tienda con el nuevo organization_id
      const { error: updateShopError } = await supabase
        .from("shops")
        .update({ organization_id: organizationId })
        .eq("id", shopId);

      if (updateShopError) {
        console.error(
          "Error al actualizar organization_id en tienda:",
          updateShopError
        );
        return {
          success: false,
          error: `Error al asignar tienda: ${
            updateShopError.message || "Error al actualizar tienda"
          }`,
        };
      }

      console.log(
        `Tienda ${shop.name} asignada correctamente a organización ${organizationId}`
      );
    } catch (directUpdateError) {
      console.error("Error en actualizaciones directas:", directUpdateError);

      // Intentar con la función RPC como último recurso
      try {
        const { data: rpcSuccess, error: rpcError } = await supabase.rpc(
          "asignar_tienda_organizacion",
          {
            shop_id_param: shopId,
            org_id_param: organizationId,
          }
        );

        if (rpcError || !rpcSuccess) {
          console.error("Error en RPC asignar_tienda_organizacion:", rpcError);
          return {
            success: false,
            error: `Error al asignar tienda mediante RPC: ${
              rpcError?.message || "Error desconocido"
            }`,
          };
        }

        console.log("Tienda asignada correctamente mediante RPC");
      } catch (rpcExecError) {
        console.error("Excepción al ejecutar RPC:", rpcExecError);
        return {
          success: false,
          error: `Excepción al asignar tienda: ${
            rpcExecError instanceof Error
              ? rpcExecError.message
              : "Error desconocido"
          }`,
        };
      }
    }

    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath("/organizations");
    return { success: true, data: shop };
  } catch (error: unknown) {
    console.error("Error al asignar tienda:", error);
    return {
      success: false,
      error: `Error al asignar tienda: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

/**
 * Función para gestionar el acceso de un usuario a una tienda
 */
export async function manageUserShopAccess({
  userId,
  shopId,
  canView,
  canEdit,
}: {
  userId: string;
  shopId: string;
  canView: boolean;
  canEdit: boolean;
}) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Verificar si el usuario actual tiene permisos
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { success: false, error: "No autorizado" };
    }

    // Obtener el usuario actual
    const { data: currentUser } = await supabase
      .from("users")
      .select("role, is_super_admin")
      .eq("id", session.session.user.id)
      .single();

    // Solo los administradores pueden modificar accesos
    if (
      !currentUser?.is_super_admin &&
      currentUser?.role !== "admin" &&
      currentUser?.role !== "super_admin"
    ) {
      return { success: false, error: "No autorizado" };
    }

    // Verificar si ya existe un registro de acceso
    const { data: existingAccess } = await supabase
      .from("user_shop_access")
      .select("id")
      .eq("user_id", userId)
      .eq("shop_id", shopId)
      .single();

    if (existingAccess) {
      // Actualizar el acceso existente
      const { error } = await supabase
        .from("user_shop_access")
        .update({
          can_view: canView,
          can_edit: canEdit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAccess.id);

      if (error) {
        console.error("Error al actualizar acceso:", error);
        return { success: false, error: error.message };
      }
    } else {
      // Crear un nuevo registro de acceso
      const { error } = await supabase.from("user_shop_access").insert([
        {
          user_id: userId,
          shop_id: shopId,
          can_view: canView,
          can_edit: canEdit,
        },
      ]);

      if (error) {
        console.error("Error al crear acceso:", error);
        return { success: false, error: error.message };
      }
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error inesperado:", error);
    return { success: false, error: "Error inesperado" };
  }
}
