"use server";

import { WebhookRequest, Message } from "@/types/chat";
import { generateUUID } from "@/utils/uuid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { getUserRole } from "./auth";

const WEBHOOK_URL = process.env.WEBHOOK_URL as string;
if (!WEBHOOK_URL) {
  throw new Error("WEBHOOK_URL no está definida en las variables de entorno");
}

export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("chatSessionId")?.value;

  if (!sessionId) {
    const newSessionId = generateUUID();
    cookieStore.set("chatSessionId", newSessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
    });
    return newSessionId;
  }

  return sessionId;
}

export async function createNewSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const newSessionId = generateUUID();
  cookieStore.set("chatSessionId", newSessionId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
  });
  return newSessionId;
}

// Función para obtener el usuario actual
export async function getCurrentUser() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting current user:", error.message);
    return null;
  }

  return data.user || null;
}

export async function getStoredMessages(): Promise<Message[]> {
  // Acceder a cookies directamente, sin caché
  const cookiesList = await cookies();
  const messages = cookiesList.get("chatMessages")?.value;
  return messages ? JSON.parse(messages) : [];
}

export async function updateMessages(messages: Message[]): Promise<void> {
  const cookiesList = await cookies();
  cookiesList.set({
    name: "chatMessages",
    value: JSON.stringify(messages),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  // Guardar mensajes en la base de datos solo si el usuario está autenticado
  if (messages.length > 0) {
    const supabase = await createClient(cookiesList);
    const { data: userData, error } = await supabase.auth.getUser();

    // Solo guardar en la base de datos si hay un usuario autenticado
    if (!error && userData?.user?.id) {
      const userId = userData.user.id;

      // Obtener el último mensaje para usarlo como título si no hay uno definido
      const lastUserMessage = [...messages].reverse().find((m) => m.isUser);
      const sessionId = messages[0].session_id;
      const t = await getTranslations("chat");

      // Verificar si ya existe un registro para esta sesión
      const { data: existingSession } = await supabase
        .from("n8n_chat_histories")
        .select()
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .limit(1);

      if (existingSession && existingSession.length > 0) {
        // Actualizar el registro existente
        await supabase
          .from("n8n_chat_histories")
          .update({
            messages: messages,
            updated_at: new Date().toISOString(),
            title:
              existingSession[0].title ||
              lastUserMessage?.text ||
              t("newConversation"),
          })
          .eq("session_id", sessionId)
          .eq("user_id", userId);
      } else {
        // Crear un nuevo registro
        await supabase.from("n8n_chat_histories").insert({
          session_id: sessionId,
          user_id: userId,
          messages: messages,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          title: lastUserMessage?.text || t("newConversation"),
        });
      }
    }
  }

  // Revalidar rutas específicas para actualizar la caché
  revalidatePath("/chat");

  // Si hay mensajes, revalidar también la ruta específica de la sesión
  if (messages.length > 0) {
    const sessionId = messages[0].session_id;
    if (sessionId) {
      revalidatePath(`/chat/${sessionId}`);
    }
  }
}

export async function clearMessages(): Promise<void> {
  const cookiesList = await cookies();
  cookiesList.set({
    name: "chatMessages",
    value: "[]",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  revalidatePath("/");
}

export async function sendMessage(
  sessionId: string,
  message: string,
  prompt?: Record<string, unknown>,
  urlParams?: Record<string, unknown>
) {
  // Obtener el usuario actual
  const currentUser = await getCurrentUser();
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Variables para el webhook
  let isAdmin = false;
  let isShop = false;
  let userRole = "user"; // Por defecto, asumimos que es un usuario normal

  console.log("sendMessage - Usuario actual:", currentUser?.id);
  console.log("sendMessage - URL Params:", JSON.stringify(urlParams));
  console.log("sendMessage - Prompt:", JSON.stringify(prompt));

  // Determinar el rol del usuario usando la misma lógica que useUserRole
  if (currentUser) {
    try {
      // Usar getUserRole para obtener el rol del usuario
      const userRoleInfo = await getUserRole();

      console.log(
        "sendMessage - Información de rol obtenida:",
        JSON.stringify(userRoleInfo)
      );

      userRole = userRoleInfo.role || "user";
      isAdmin = userRoleInfo.role === "admin";
      isShop = userRoleInfo.role === "shop";

      console.log("sendMessage - Rol del usuario:", userRole);
      console.log("sendMessage - Es admin:", isAdmin);
      console.log("sendMessage - Es shop:", isShop);
    } catch (error) {
      console.error("Error al obtener el rol del usuario:", error);
    }
  } else {
    console.log("sendMessage - No hay usuario autenticado");
  }

  // PASO 1: Determinar el webhook URL basado ÚNICAMENTE en el rol del usuario
  // Esta es la parte más importante y no debe ser modificada después
  let webhookUrl;
  if (isShop) {
    webhookUrl = process.env.SHOP_WEBHOOK_URL;
    console.log(
      "sendMessage - Usuario es shop, usando SHOP_WEBHOOK_URL:",
      webhookUrl
    );
  } else if (isAdmin) {
    webhookUrl = process.env.ADMIN_WEBHOOK_URL || process.env.WEBHOOK_URL;
    console.log(
      "sendMessage - Usuario es admin, usando ADMIN_WEBHOOK_URL o WEBHOOK_URL:",
      webhookUrl
    );
  } else {
    webhookUrl = process.env.WEBHOOK_URL;
    console.log(
      "sendMessage - Usuario es user, usando WEBHOOK_URL:",
      webhookUrl
    );
  }

  if (!webhookUrl) {
    throw new Error(
      "URL del webhook no está definida en las variables de entorno"
    );
  }

  try {
    // PASO 2: Crear el objeto de solicitud webhook
    const webhookRequest: WebhookRequest = {
      sessionId,
      action: "sendMessage",
      chatInput: message,
    };

    // Añadir el ID del usuario si está autenticado
    if (currentUser?.id) {
      webhookRequest.userId = currentUser.id;
    }

    // Añadir el prompt si se proporciona
    if (prompt) {
      webhookRequest.prompt = prompt;
    }

    // PASO 3: Determinar el agentId
    let agentId: string | undefined;

    // Prioridad 1: Si hay un agentId en los parámetros de URL, usarlo
    if (urlParams && urlParams.agentId) {
      agentId = urlParams.agentId as string;
      console.log("sendMessage - Usando agentId de parámetros URL:", agentId);

      // Verificar que el agente sea compatible con el rol del usuario
      if (agentId) {
        const { data: agent } = await supabase
          .from("agents")
          .select("*")
          .eq("id", agentId)
          .single();

        if (agent) {
          console.log(
            "sendMessage - Información del agente:",
            JSON.stringify(agent)
          );

          // Verificar compatibilidad de target_role con el rol del usuario
          if (
            !isAdmin &&
            agent.target_role !== "both" &&
            agent.target_role !== userRole
          ) {
            console.log(
              `sendMessage - Agente incompatible con el rol del usuario. Agent target_role: ${agent.target_role}, User role: ${userRole}`
            );
            const t = await getTranslations("chat");
            return {
              success: false,
              message:
                t("agentNotAvailableForRole") ||
                "Este agente no está disponible para tu rol.",
            };
          }
        }
      }
    }
    // Prioridad 2: Si hay un agentId en el prompt (caso del AgentChatPreview), usarlo
    else if (prompt && prompt.id) {
      agentId = prompt.id as string;
      console.log("sendMessage - Usando agentId del prompt:", agentId);

      // Verificar que el agente sea compatible con el rol del usuario
      if (agentId) {
        const { data: agent } = await supabase
          .from("agents")
          .select("*")
          .eq("id", agentId)
          .single();

        if (agent) {
          console.log(
            "sendMessage - Información del agente (prompt):",
            JSON.stringify(agent)
          );

          // Verificar compatibilidad de target_role con el rol del usuario
          if (
            !isAdmin &&
            agent.target_role !== "both" &&
            agent.target_role !== userRole
          ) {
            console.log(
              `sendMessage - Agente incompatible con el rol del usuario. Agent target_role: ${agent.target_role}, User role: ${userRole}`
            );
            const t = await getTranslations("chat");
            return {
              success: false,
              message:
                t("agentNotAvailableForRole") ||
                "Este agente no está disponible para tu rol.",
            };
          }
        }
      }
    }
    // Prioridad 3: Buscar un agente por defecto según el rol
    else {
      console.log(
        "sendMessage - Buscando agente por defecto para rol:",
        userRole
      );

      if (isShop) {
        // IMPORTANTE: Buscar primero un agente con target_role exactamente igual a "shop"
        const { data: exactShopAgents } = await supabase
          .from("agents")
          .select("*")
          .eq("is_active", true)
          .eq("target_role", "shop")
          .limit(1);

        if (exactShopAgents && exactShopAgents.length > 0) {
          agentId = exactShopAgents[0].id;
          console.log(
            "sendMessage - Usando agente con target_role=shop:",
            agentId
          );
        } else {
          // Si no hay agentes específicos para shop, buscar agentes con target_role="both"
          const { data: bothAgents } = await supabase
            .from("agents")
            .select("*")
            .eq("is_active", true)
            .eq("target_role", "both")
            .limit(1);

          if (bothAgents && bothAgents.length > 0) {
            agentId = bothAgents[0].id;
            console.log(
              "sendMessage - Usando agente con target_role=both para shop:",
              agentId
            );
          }
        }
      } else {
        // IMPORTANTE: Buscar primero un agente con target_role exactamente igual a "user"
        const { data: exactUserAgents } = await supabase
          .from("agents")
          .select("*")
          .eq("is_active", true)
          .eq("target_role", "user")
          .limit(1);

        if (exactUserAgents && exactUserAgents.length > 0) {
          agentId = exactUserAgents[0].id;
          console.log(
            "sendMessage - Usando agente con target_role=user:",
            agentId
          );
        } else {
          // Si no hay agentes específicos para user, buscar agentes con target_role="both"
          const { data: bothAgents } = await supabase
            .from("agents")
            .select("*")
            .eq("is_active", true)
            .eq("target_role", "both")
            .limit(1);

          if (bothAgents && bothAgents.length > 0) {
            agentId = bothAgents[0].id;
            console.log(
              "sendMessage - Usando agente con target_role=both para user:",
              agentId
            );
          }
        }
      }
    }

    // Si no se encontró un agentId y no es admin, mostrar error
    if (!agentId && !isAdmin) {
      const t = await getTranslations("chat");
      return {
        success: false,
        message: t("noAgentsAvailable") || "No hay agentes disponibles.",
      };
    }

    // Añadir el agentId al webhook request si existe
    if (agentId) {
      webhookRequest.agentId = agentId;
      console.log("sendMessage - Añadido agentId al webhook:", agentId);
    }

    // PASO 4: Enviar la solicitud al webhook
    console.log("sendMessage - Enviando solicitud al webhook:", webhookUrl);
    console.log(
      "sendMessage - Cuerpo de la solicitud:",
      JSON.stringify(webhookRequest)
    );

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookRequest),
    });

    if (!response.ok) {
      console.error(`Error en la respuesta del webhook: ${response.status}`);
      console.error(`Texto de la respuesta: ${await response.text()}`);
      throw new Error(`Error en la respuesta del webhook: ${response.status}`);
    }

    const data = await response.json();
    console.log("sendMessage - Respuesta del webhook:", JSON.stringify(data));

    // Extraer el mensaje de la respuesta, que puede ser un objeto o un array
    let responseMessage = "";

    if (Array.isArray(data)) {
      // Si es un array, tomamos el output del primer elemento
      console.log("sendMessage - La respuesta es un array");
      if (data.length > 0 && data[0].output) {
        responseMessage = data[0].output;
        console.log(
          "sendMessage - Mensaje extraído del array:",
          responseMessage
        );
      } else {
        console.error("sendMessage - Array vacío o sin propiedad output");
        throw new Error("Respuesta del webhook inválida: array sin datos");
      }
    } else if (data && typeof data === "object") {
      // Si es un objeto, intentamos obtener la propiedad message o output
      console.log("sendMessage - La respuesta es un objeto");
      responseMessage = data.message || data.output || "";
      console.log(
        "sendMessage - Mensaje extraído del objeto:",
        responseMessage
      );
    } else {
      console.error(
        "sendMessage - Formato de respuesta desconocido:",
        typeof data
      );
      throw new Error("Respuesta del webhook en formato desconocido");
    }

    if (!responseMessage) {
      console.error(
        "sendMessage - No se pudo extraer un mensaje de la respuesta"
      );
      throw new Error(
        "No se pudo extraer un mensaje de la respuesta del webhook"
      );
    }

    // Guardar el mensaje en la base de datos
    if (currentUser?.id) {
      await supabase.from("messages").insert([
        {
          session_id: sessionId,
          user_id: currentUser.id,
          input: message,
          output: responseMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    // Después de procesar la respuesta y antes de retornar
    if (response.ok) {
      // Revalidar las rutas de chat para actualizar la caché
      revalidatePath("/chat");
      revalidatePath(`/chat/${sessionId}`);

      return {
        success: true,
        message: responseMessage,
      };
    } else {
      console.error("Error en la respuesta del webhook:", response.status);

      // Revalidar las rutas de chat para actualizar la caché incluso en caso de error
      revalidatePath("/chat");
      revalidatePath(`/chat/${sessionId}`);

      return {
        success: false,
        message: "Lo siento, ocurrió un error al procesar tu mensaje.",
      };
    }
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    const t = await getTranslations("chat");
    return {
      success: false,
      message: t("errorMessage") || "Error al procesar tu mensaje.",
    };
  }
}

export async function getChatHistory(userId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data: history } = await supabase
    .from("n8n_chat_histories")
    .select()
    .eq("user_id", userId);
  return history;
}

// Función para eliminar una sesión de chat
export async function deleteChatSession(userId: string, sessionId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { error } = await supabase
    .from("n8n_chat_histories")
    .delete()
    .match({ user_id: userId, session_id: sessionId });

  if (error) {
    console.error("Error al eliminar la sesión de chat:", error);
    throw new Error("No se pudo eliminar la sesión de chat");
  }

  return { success: true };
}

// Función para actualizar el título de una sesión de chat
export async function updateChatTitle(
  userId: string,
  sessionId: string,
  title: string
) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // Actualizar el título en la sesión de chat
  const { error } = await supabase
    .from("n8n_chat_histories")
    .update({ title: title })
    .match({ user_id: userId, session_id: sessionId });

  if (error) {
    console.error("Error al actualizar el título:", error);
    throw new Error("No se pudo actualizar el título");
  }

  return { success: true };
}
