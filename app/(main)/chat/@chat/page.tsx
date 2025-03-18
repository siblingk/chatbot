import { getStoredMessages } from "@/app/actions/chat";
import SharedChatContainer from "@/components/chat/chat-container";

// Función para obtener mensajes almacenados
export default async function ChatPage() {
  // Obtener mensajes almacenados en el servidor directamente
  // No usamos caché para datos que dependen de cookies
  const messages = await getStoredMessages();

  return <SharedChatContainer initialMessages={messages} />;
}
