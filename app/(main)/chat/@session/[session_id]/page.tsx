import { getChatHistory } from "@/app/actions/chat";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SharedChatContainer from "@/components/chat/chat-container";

interface SessionChatPageProps {
  params: {
    session_id: string;
  };
}

export default async function SessionChatPage({
  params,
}: SessionChatPageProps) {
  const { session_id } = params;
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
