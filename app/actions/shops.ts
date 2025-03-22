"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Shop, ShopActionState } from "@/types/shops";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema de validación para los formularios de tiendas
const shopSchema = z.object({
  name: z.string().min(1, "El nombre de la tienda es obligatorio"),
  location: z.string().min(1, "La ubicación de la tienda es obligatoria"),
  rating: z.coerce.number().min(0).max(5),
  status: z.enum(["active", "inactive"]),
  rate: z.coerce.number().min(0),
  labor_tax_percentage: z.coerce.number().min(0).max(100),
  parts_tax_percentage: z.coerce.number().min(0).max(100),
  misc_tax_percentage: z.coerce.number().min(0).max(100),
});

// Obtener todas las tiendas
export async function getShops(): Promise<Shop[]> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching shops:", error);
    return [];
  }

  return data as Shop[];
}

// Crear una nueva tienda
export async function createShopAction(
  prevState: ShopActionState,
  formData: FormData
): Promise<ShopActionState> {
  // Validar los datos del formulario
  const validatedFields = shopSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    rating: formData.get("rating"),
    status: formData.get("status"),
    rate: formData.get("rate"),
    labor_tax_percentage: formData.get("labor_tax_percentage"),
    parts_tax_percentage: formData.get("parts_tax_percentage"),
    misc_tax_percentage: formData.get("misc_tax_percentage"),
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

  // Obtener el organizationId si existe
  const organizationId = formData.get("organizationId") as string | null;

  try {
    // Insertar la tienda
    const { data, error } = await supabase
      .from("shops")
      .insert([validatedFields.data])
      .select("id")
      .single();

    if (error) {
      return {
        message: `Error al crear la tienda: ${error.message}`,
      };
    }

    // Si hay organizationId y se creó la tienda correctamente, asignarla a la organización
    if (organizationId && data?.id) {
      const { error: assignError } = await supabase
        .from("organization_shops")
        .insert([
          {
            organization_id: organizationId,
            shop_id: data.id,
          },
        ]);

      if (assignError) {
        return {
          message: `La tienda se creó pero no se pudo asignar a la organización: ${assignError.message}`,
        };
      }
    }

    // Revalidar tanto la página de configuración como la de organizaciones
    revalidatePath("/settings");
    if (organizationId) {
      revalidatePath(`/organizations/${organizationId}`);
    }

    return { message: "Tienda creada con éxito" };
  } catch (error) {
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

// Actualizar una tienda existente
export async function updateShopAction(
  id: string,
  prevState: ShopActionState,
  formData: FormData
): Promise<ShopActionState> {
  // Validar que el ID no sea nulo o vacío
  if (!id) {
    console.error("ID nulo o vacío para actualizar:", id);
    return {
      message: "ID inválido para actualizar",
    };
  }

  // Validar los datos del formulario
  const validatedFields = shopSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    rating: formData.get("rating"),
    status: formData.get("status"),
    rate: formData.get("rate"),
    labor_tax_percentage: formData.get("labor_tax_percentage"),
    parts_tax_percentage: formData.get("parts_tax_percentage"),
    misc_tax_percentage: formData.get("misc_tax_percentage"),
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
    const { error } = await supabase
      .from("shops")
      .update(validatedFields.data)
      .eq("id", id);

    if (error) {
      return {
        message: `Error al actualizar la tienda: ${error.message}`,
      };
    }

    revalidatePath("/settings");
    return { message: "Tienda actualizada con éxito" };
  } catch (error) {
    return {
      message: `Error inesperado: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}
