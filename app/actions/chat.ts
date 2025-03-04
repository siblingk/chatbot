"use server";

import { WebhookRequest, Message } from "@/types/chat";
import { generateUUID } from "@/utils/uuid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

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
  const WEBHOOK_URL = process.env.WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    throw new Error("WEBHOOK_URL no está definida en las variables de entorno");
  }

  try {
    // Obtener el usuario actual
    const currentUser = await getCurrentUser();

    const webhookRequest: WebhookRequest = {
      sessionId,
      action: "sendMessage",
      chatInput: message,
    };

    // Añadir el ID del usuario si está autenticado
    if (currentUser?.id) {
      webhookRequest.userId = currentUser.id;
    }

    // Crear o actualizar el objeto prompt con los parámetros de URL
    let finalPrompt: Record<string, unknown> = {};

    // Si ya existe un prompt, usarlo como base
    if (prompt) {
      finalPrompt = { ...prompt };
    }

    // Añadir todos los parámetros de URL al objeto prompt
    if (urlParams) {
      Object.entries(urlParams).forEach(([key, value]) => {
        // No incluir agentConfig en el prompt si ya está el objeto completo
        if (key !== "agentConfig" || !finalPrompt.hasOwnProperty("id")) {
          finalPrompt[key] = value;
        }
      });
    }

    // Añadir el prompt final al webhook request
    if (Object.keys(finalPrompt).length > 0) {
      webhookRequest.prompt = finalPrompt;
    }

    const response = await fetch(WEBHOOK_URL, {
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
