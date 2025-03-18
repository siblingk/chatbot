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

    // Crear un shop por defecto para esta organización
    const { error: shopError } = await supabase.from("shops").insert({
      name: `${name} Shop`,
      organization_id: organization.id,
      location: "Default Location",
    });

    if (shopError) {
      console.error("Error al crear shop:", shopError);
      return {
        success: false,
        error: "Error al crear shop para la organización",
      };
    }

    revalidatePath("/organizations");
    return { success: true, data: organization };
  } catch (error) {
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

    // Eliminar la organización (ya no verificamos permisos por usuario)
    const { error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error al eliminar organización:", deleteError);
      return { success: false, error: "Error al eliminar organización" };
    }

    revalidatePath("/organizations");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar organización:", error);
    return { success: false, error: "Error al eliminar organización" };
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
 * Elimina un shop
 */
export async function deleteShop(shopId: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Obtener el shop para saber a qué organización pertenece
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("organization_id")
      .eq("id", shopId)
      .single();

    if (shopError) {
      console.error("Error al obtener shop:", shopError);
      return { success: false, error: "Error al obtener shop" };
    }

    // Eliminar el shop
    const { error: deleteError } = await supabase
      .from("shops")
      .delete()
      .eq("id", shopId);

    if (deleteError) {
      console.error("Error al eliminar shop:", deleteError);
      return { success: false, error: "Error al eliminar shop" };
    }

    // El trigger en la base de datos actualizará automáticamente la lista de shops en la organización

    revalidatePath(`/organizations/${shop.organization_id}`);
    revalidatePath("/organizations");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar shop:", error);
    return { success: false, error: "Error al eliminar shop" };
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

    // Obtener información de la tienda
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single();

    if (shopError) {
      console.error("Error al obtener tienda:", shopError);
      return { success: false, error: "Error al obtener tienda" };
    }

    // Actualizar la tienda con el nuevo organization_id
    const { error: updateError } = await supabase
      .from("shops")
      .update({ organization_id: organizationId })
      .eq("id", shopId);

    if (updateError) {
      console.error("Error al actualizar tienda:", updateError);
      return {
        success: false,
        error: "Error al asignar tienda a organización",
      };
    }

    // El trigger en la base de datos actualizará automáticamente la lista de shops en la organización

    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath("/organizations");
    return { success: true, data: shop };
  } catch (error) {
    console.error("Error al asignar tienda:", error);
    return { success: false, error: "Error al asignar tienda a organización" };
  }
}
