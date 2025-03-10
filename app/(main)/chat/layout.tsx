"use client";

import { usePathname } from "next/navigation";

export default function ChatLayout({
  children,
  chat,
  session,
}: {
  children: React.ReactNode;
  chat: React.ReactNode;
  session: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determinar qué contenido mostrar basado en la ruta actual
  const isSessionRoute = pathname.includes("/chat/") && pathname !== "/chat";

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Mostrar el contenido principal solo si no estamos en una ruta de sesión */}
      {!isSessionRoute && children}

      {/* Mostrar el chat normal solo si estamos en la ruta /chat */}
      {pathname === "/chat" && chat}

      {/* Mostrar el chat de sesión solo si estamos en una ruta de sesión */}
      {isSessionRoute && session}
    </div>
  );
}
