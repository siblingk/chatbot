"use server";
import { getChatHistory } from "@/app/actions/chat";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ChatSessionContainer from "./chat-session-container";
import { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

interface ChatPageProps {
  params: Promise<{
    session_id: string;
  }>;
}

export async function generateMetadata(
  { params }: ChatPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { session_id } = await params;
  const t = await getTranslations("chat");

  // Puedes obtener metadatos del padre si es necesario
  const previousImages = (await parent).openGraph?.images || [];

  const sessionIdShort = session_id.substring(0, 8);

  return {
    title: t("sessionTitle", { id: sessionIdShort }),
    description: t("sessionDescription", { id: sessionIdShort }),
    openGraph: {
      title: t("sessionTitle", { id: sessionIdShort }),
      description: t("sessionDescription", { id: sessionIdShort }),
      images: [...previousImages],
    },
    twitter: {
      card: "summary_large_image",
      title: t("sessionTitle", { id: sessionIdShort }),
      description: t("sessionDescription", { id: sessionIdShort }),
    },
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { session_id } = await params;
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Verificar si el usuario está autenticado
  const { data: session, error: sessionError } =
    await supabase.auth.getSession();

  // Si no hay sesión o hay un error, redirigir a la página principal
  if (!session?.session || sessionError) {
    console.log("Usuario no autenticado, redirigiendo a la página principal");
    redirect("/");
  }

  // Obtener información del usuario
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error al obtener información del usuario:", userError);
    redirect("/");
  }

  const userId = userData?.user?.id;

  if (!userId) {
    console.error("ID de usuario no disponible");
    redirect("/");
  }

  try {
    const messages = await getChatHistory(userId);

    // Filtrar mensajes por session_id
    const sessionMessages = messages?.filter(
      (message) => message.session_id === session_id
    );

    // Incluso si no hay mensajes, permitimos acceder a la sesión
    // Esto permite crear nuevos chats con un ID de sesión específico

    // Serializar los mensajes para pasarlos al cliente (o un array vacío si no hay mensajes)
    const serializedMessages =
      sessionMessages?.map((message) => ({
        ...message,
        timestamp: message.timestamp
          ? message.timestamp.toISOString()
          : new Date().toISOString(),
      })) || [];

    return (
      <ChatSessionContainer
        sessionId={session_id}
        initialMessages={serializedMessages}
      />
    );
  } catch (error) {
    console.error("Error al obtener el historial de chat:", error);
    redirect("/");
  }
}
