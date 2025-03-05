"use server";

import { WebhookRequest, Message } from "@/types/chat";
import { generateUUID } from "@/utils/uuid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";

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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user || null;
}

export async function getStoredMessages(): Promise<Message[]> {
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

  // Guardar mensajes en la base de datos
  if (messages.length > 0) {
    const supabase = await createClient(cookiesList);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userId) {
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

  revalidatePath("/");
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
  // Obtener el usuario actual y su rol
  const currentUser = await getCurrentUser();

  // Determinar qué webhook URL usar según el rol del usuario
  let webhookUrl = process.env.WEBHOOK_URL;

  if (currentUser?.id) {
    // Obtener el rol del usuario desde la base de datos
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (!error && userData?.role) {
      // Si el usuario tiene el rol 'shop', usar el webhook específico para tiendas
      if (userData.role === "shop") {
        webhookUrl = process.env.SHOP_WEBHOOK_URL;
      }
    }
  }

  if (!webhookUrl) {
    throw new Error(
      "URL del webhook no está definida en las variables de entorno"
    );
  }

  try {
    const webhookRequest: WebhookRequest = {
      sessionId,
      action: "sendMessage",
      chatInput: message,
    };

    // Añadir el ID del usuario si está autenticado
    if (currentUser?.id) {
      webhookRequest.userId = currentUser.id;
    }

    // Añadir el agentId directamente al webhook request si está en los parámetros de URL
    if (urlParams && urlParams.agentId) {
      webhookRequest.agentId = urlParams.agentId as string;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookRequest),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.text();
    let botResponse = "";

    try {
      const parsedData = JSON.parse(data);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        botResponse = parsedData[0].output || parsedData[0].response || "";
      } else if (typeof parsedData === "object") {
        botResponse = parsedData.output || parsedData.response || "";
      } else {
        botResponse = data;
      }
    } catch {
      botResponse = data;
    }

    return { success: true, message: botResponse };
  } catch (error) {
    console.error("Error al enviar mensaje:", error);

    // Obtener el idioma actual del usuario
    const cookieStore = await cookies();
    const locale = cookieStore.get("user_locale")?.value || "es";

    // Obtener el mensaje de error de las traducciones según el idioma
    const messages = await import(`../../messages/${locale}.json`);
    const errorMessage = messages.default.chat.errorMessage;

    return {
      success: false,
      message: errorMessage,
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
