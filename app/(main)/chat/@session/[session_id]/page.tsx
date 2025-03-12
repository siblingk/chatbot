import { getChatHistory } from "@/app/actions/chat";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SharedChatContainer from "@/components/chat/chat-container";

interface SessionChatPageProps {
  params: Promise<{
    session_id: string;
  }>;
}

export default async function SessionChatPage({
  params,
}: SessionChatPageProps) {
  const { session_id } = await params;
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Verificar si el usuario está autenticado de forma segura
  const { data, error: userError } = await supabase.auth.getUser();

  // Si no hay usuario o hay un error, redirigir a la página principal
  if (!data.user || userError) {
    console.log("Usuario no autenticado, redirigiendo a la página principal");
    redirect("/");
  }

  const userId = data.user.id;

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

    // Serializar los mensajes para pasarlos al cliente
    const serializedMessages =
      sessionMessages?.map((message) => ({
        ...message,
        timestamp: message.timestamp
          ? message.timestamp.toISOString()
          : new Date().toISOString(),
      })) || [];

    return (
      <SharedChatContainer
        sessionId={session_id}
        initialMessages={serializedMessages}
      />
    );
  } catch (error) {
    console.error("Error al obtener el historial de chat:", error);
    redirect("/");
  }
}
