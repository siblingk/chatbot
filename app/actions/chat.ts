"use server";

import { WebhookRequest, Message } from "@/types/chat";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { generateUUID } from "@/lib/utils/uuid";

const WEBHOOK_URL = process.env.WEBHOOK_URL as string;
if (!WEBHOOK_URL) {
  throw new Error("WEBHOOK_URL no está definida en las variables de entorno");
}

export async function getOrCreateSessionId(): Promise<string> {
  const cookiesList = await cookies();
  const sessionId = cookiesList.get("chatSessionId")?.value;

  if (!sessionId) {
    const newSessionId = generateUUID();
    cookiesList.set({
      name: "chatSessionId",
      value: newSessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
    revalidatePath("/");
    return newSessionId;
  }

  return sessionId;
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

export async function sendMessage(sessionId: string, message: string) {
  try {
    const webhookRequest: WebhookRequest = {
      sessionId,
      action: "sendMessage",
      chatInput: message,
    };

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookRequest),
    });

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

    revalidatePath("/");
    return { success: true, message: botResponse };
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    return {
      success: false,
      message:
        "Lo siento, hubo un error al enviar tu mensaje. Por favor, intenta de nuevo.",
    };
  }
}
