import { getChatHistory } from "@/app/actions/chat";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SharedChatContainer from "@/components/chat/chat-container";
import { unstable_cache } from "next/cache";
import { Message } from "@/types/chat";

interface SessionChatPageProps {
  params: Promise<{
    session_id: string;
  }>;
}

// Definir el tipo para los mensajes de chat de la base de datos
interface ChatHistoryMessage {
  id: string;
  session_id: string;
  user_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  title?: string;
  timestamp?: Date | string;
}

// Función para obtener mensajes de chat cacheada
// Esta función no accede a cookies directamente, recibe los mensajes como parámetro
const filterAndSerializeMessages = unstable_cache(
  async (messages: ChatHistoryMessage[] | null, sessionId: string) => {
    // Filtrar mensajes por session_id
    const sessionMessages = messages?.filter(
      (message) => message.session_id === sessionId
    );

    // Serializar los mensajes para pasarlos al cliente
    return (
      sessionMessages?.map((message) => ({
        ...message,
        timestamp:
          message.timestamp instanceof Date
            ? message.timestamp.toISOString()
            : typeof message.timestamp === "string"
            ? message.timestamp
            : new Date().toISOString(),
      })) || []
    );
  },
  ["chat-messages-filtered"],
  { revalidate: 1 } // Revalidar cada segundo para mantener los datos frescos
);

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
    // Primero obtenemos los mensajes fuera de la función cacheada
    const messages = await getChatHistory(userId);

    // Luego filtramos y serializamos los mensajes usando la función cacheada
    const serializedMessages = await filterAndSerializeMessages(
      messages,
      session_id
    );

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
