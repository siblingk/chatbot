import { redirect } from "next/navigation";

export default function Home() {
  // Redirigir a la ruta de chat
  redirect("/chat");
}
