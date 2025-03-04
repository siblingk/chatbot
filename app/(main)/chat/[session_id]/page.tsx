"use server";
import { getChatHistory } from "@/app/actions/chat";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ChatSessionContainer from "./chat-session-container";

interface ChatPageProps {
  params: {
    session_id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { session_id } = params;
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error(error);
  }

  const messages = await getChatHistory(data?.user?.id ?? "");

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
    <ChatSessionContainer
      sessionId={session_id}
      initialMessages={serializedMessages}
    />
  );
}
