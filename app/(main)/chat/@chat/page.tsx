import { getStoredMessages } from "@/app/actions/chat";
import SharedChatContainer from "@/components/chat/chat-container";

export default async function ChatPage() {
  // Obtener mensajes almacenados en el servidor
  const messages = await getStoredMessages();

  return <SharedChatContainer initialMessages={messages} />;
}
