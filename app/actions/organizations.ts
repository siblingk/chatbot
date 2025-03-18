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

  // Obtener todas las organizaciones (ya no filtramos por usuario)
  const { data, error } = await supabase.rpc("get_user_organizations", {
    user_uuid: "00000000-0000-0000-0000-000000000000", // ID ficticio, ya no se usa
  });

  if (error) {
    console.error("Error al obtener organizaciones:", error);
    return [];
  }

  return data || [];
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
export async function createOrganization(name: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Generar slug a partir del nombre
    const slug = generateSlug(name);

    // Crear la organización
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name,
        slug,
        shops: [],
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
 * Actualiza una organización existente
 */
export async function updateOrganization(id: string, data: { name: string }) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Actualizar la organización (ya no verificamos permisos por usuario)
    const { data: organization, error: updateError } = await supabase
      .from("organizations")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error al actualizar organización:", updateError);
      return { success: false, error: "Error al actualizar organización" };
    }

    revalidatePath(`/organizations/${id}`);
    revalidatePath("/organizations");
    return { success: true, data: organization };
  } catch (error) {
    console.error("Error al actualizar organización:", error);
    return { success: false, error: "Error al actualizar organización" };
  }
}

/**
 * Elimina una organización
 */
export async function deleteOrganization(id: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Obtener información de la organización para registros
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", id)
      .single();

    if (orgError) {
      console.error("Error al obtener información de organización:", orgError);
      // Continuamos de todos modos
    }

    // Primero, obtener todas las tiendas asociadas a esta organización
    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select("id")
      .eq("organization_id", id);

    if (shopsError) {
      console.error("Error al obtener tiendas de la organización:", shopsError);
      // Continuamos de todos modos
    } else if (shops && shops.length > 0) {
      // Actualizar todas las tiendas para desasociarlas de la organización
      const { error: updateShopsError } = await supabase
        .from("shops")
        .update({ organization_id: null })
        .eq("organization_id", id);

      if (updateShopsError) {
        console.error("Error al desasociar tiendas:", updateShopsError);
        // Continuamos de todos modos
      }
    }

    // Finalmente, eliminar la organización
    const { error: deleteOrgError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id);

    if (deleteOrgError) {
      console.error("Error al eliminar organización:", deleteOrgError);
      return {
        success: false,
        error: `Error al eliminar organización: ${
          deleteOrgError.message || "Error desconocido"
        }`,
      };
    }

    console.log(`Organización ${org?.name || id} eliminada correctamente`);

    revalidatePath("/organizations");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar organización:", error);
    return {
      success: false,
      error: `Error al eliminar organización: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

/**
 * Crea un nuevo shop para una organización
 */
export async function createShop(
  organizationId: string,
  name: string,
  location: string = "Default Location"
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Crear el shop
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .insert({
        name,
        organization_id: organizationId,
        location,
      })
      .select()
      .single();

    if (shopError) {
      console.error("Error al crear shop:", shopError);
      return { success: false, error: "Error al crear shop" };
    }

    // Actualizar la lista de shops en la organización
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("shops")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      console.error("Error al obtener organización:", orgError);
      return { success: true, data: shop }; // Devolvemos éxito aunque no se actualice la lista
    }

    // Añadir el nuevo shop a la lista
    const updatedShops = [
      ...(organization.shops || []),
      {
        id: shop.id,
        name: shop.name,
      },
    ];

    // Actualizar la organización
    const { error: updateError } = await supabase
      .from("organizations")
      .update({ shops: updatedShops })
      .eq("id", organizationId);

    if (updateError) {
      console.error("Error al actualizar organización:", updateError);
    }

    revalidatePath(`/organizations/${organizationId}`);
    return { success: true, data: shop };
  } catch (error) {
    console.error("Error al crear shop:", error);
    return { success: false, error: "Error al crear shop" };
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

    // Agregar el usuario a la organización
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: userData.id,
        role,
      });

    if (memberError) {
      console.error("Error al agregar miembro:", memberError);
      return { success: false, error: "Error al agregar miembro" };
    }

    revalidatePath(`/organizations/${organizationId}/members`);
    return { success: true };
  } catch (error) {
    console.error("Error al agregar miembro:", error);
    return { success: false, error: "Error al agregar miembro" };
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

    // Actualizar el rol del usuario
    const { error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error al actualizar rol:", error);
      return { success: false, error: "Error al actualizar rol" };
    }

    revalidatePath(`/organizations/${organizationId}/members`);
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

    // Eliminar el miembro de la organización
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error al eliminar miembro:", error);
      return { success: false, error: "Error al eliminar miembro" };
    }

    revalidatePath(`/organizations/${organizationId}/members`);
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar miembro:", error);
    return { success: false, error: "Error al eliminar miembro" };
  }
}

/**
 * Desasocia una tienda de una organización sin eliminarla
 */
export async function removeShopFromOrganization(shopId: string) {
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

    if (!organizationId) {
      console.warn("La tienda no está asociada a ninguna organización");
      return { success: true, message: "La tienda ya estaba desasociada" }; // No hace falta hacer nada
    }

    // Imprimimos información de depuración
    console.log(
      `Intentando desasociar tienda ${shop.name} (ID: ${shopId}) de organización ${organizationId}`
    );

    // Llamar a la nueva función RPC para desasociar la tienda
    const { data: result, error: rpcError } = await supabase.rpc(
      "desasociar_tienda_organizacion",
      {
        shop_id_param: shopId,
      }
    );

    if (rpcError) {
      console.error(
        "Error al ejecutar RPC desasociar_tienda_organizacion:",
        rpcError
      );

      // Intentar el enfoque alternativo si RPC falla
      try {
        // 1. Primero actualizamos manualmente el array shops en la organización
        const { data: organization, error: orgError } = await supabase
          .from("organizations")
          .select("shops")
          .eq("id", organizationId)
          .single();

        if (orgError) {
          console.error("Error al obtener organización:", orgError);
        } else if (organization && organization.shops) {
          // Filtramos la tienda que queremos eliminar
          const updatedShops = organization.shops.filter(
            (s: { id: string }) => s.id !== shopId
          );

          // Actualizamos la organización primero
          const { error: updateOrgError } = await supabase
            .from("organizations")
            .update({ shops: updatedShops })
            .eq("id", organizationId);

          if (updateOrgError) {
            console.error(
              "Error al actualizar shops en organización:",
              updateOrgError
            );
          } else {
            console.log(
              "Campo JSONB 'shops' actualizado correctamente en la organización"
            );
          }
        }
      } catch (orgUpdateError) {
        console.error(
          "Error al actualizar campo shops en organización:",
          orgUpdateError
        );
        // Continuamos de todos modos
      }

      // 2. Ahora actualizamos la tienda para desasociarla (organization_id = null)
      try {
        // Desasociar directamente sin RPC por precaución
        const { error: updateError } = await supabase
          .from("shops")
          .update({ organization_id: null })
          .eq("id", shopId);

        if (updateError) {
          console.error(
            "Error al desasociar tienda mediante UPDATE directo:",
            updateError
          );
          return {
            success: false,
            error: `Error al desasociar tienda: ${
              updateError.message || "Error desconocido"
            }`,
          };
        }
      } catch (updateError) {
        console.error("Excepción al desasociar tienda:", updateError);
        return {
          success: false,
          error: `Error al desasociar tienda: ${
            updateError instanceof Error
              ? updateError.message
              : "Error desconocido"
          }`,
        };
      }
    } else if (!result) {
      console.error("La función RPC no devolvió un resultado exitoso");
      return {
        success: false,
        error: "Error al desasociar tienda: la operación no pudo completarse",
      };
    }

    // Verificamos si la tienda fue realmente desasociada
    const { data: shopActual, error: checkError } = await supabase
      .from("shops")
      .select("organization_id")
      .eq("id", shopId)
      .maybeSingle();

    if (checkError) {
      console.warn("Error al verificar estado de la tienda:", checkError);
    } else if (shopActual && shopActual.organization_id !== null) {
      console.error("La tienda sigue asociada a una organización");
      return {
        success: false,
        error: "Error al desasociar tienda: La operación no pudo completarse",
      };
    }

    console.log(
      `Tienda ${shop.name} (ID: ${shopId}) desasociada correctamente de organización ${organizationId}`
    );

    // Revalidar rutas para actualizar la UI
    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath("/organizations");
    return { success: true, message: "Tienda desasociada correctamente" };
  } catch (error: unknown) {
    console.error("Error al desasociar tienda:", error);
    return {
      success: false,
      error: `Error al desasociar tienda: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
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
