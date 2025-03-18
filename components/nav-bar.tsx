"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Search,
  MessageCircle,
  Receipt,
  FileText,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { ChatStatus } from "@/types/chat";
import { useChat } from "@/contexts/chat-context";
import { PrequoteDialog } from "@/components/prequote-dialog";
import { hasPrequoteData } from "@/app/actions/prequote";

export function NavBar() {
  const t = useTranslations("navbar");
  const params = useParams();
  const sessionId = params?.session_id as string;
  const supabase = createClient();
  const router = useRouter();
  const { clearChat } = useChat();
  const [userId, setUserId] = useState<string | null>(null);

  // Estado local para almacenar la información del chat
  const [chatStatus, setChatStatus] = useState<ChatStatus>("initial");
  const [quoteCount, setQuoteCount] = useState<number>(0);
  const [hasPrequote, setHasPrequote] = useState<boolean>(false);
  const [prequoteDialogOpen, setPrequoteDialogOpen] = useState<boolean>(false);

  // Obtener el user_id actual
  useEffect(() => {
    async function getUserId() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    }

    getUserId();
  }, [supabase]);

  // Cargar el estado del chat cuando cambia el sessionId
  useEffect(() => {
    async function loadChatStatus() {
      if (!sessionId) {
        setChatStatus("initial");
        setQuoteCount(0);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("leads")
          .select("status, quote_count")
          .eq("session_id", sessionId)
          .single();

        // Solo registrar errores que no sean de "no se encontraron registros"
        // PGRST116 es el código de error cuando no se encuentra un registro
        if (error && error.code !== "PGRST116") {
          // Comentado para evitar mensajes en la consola
          // console.error("Error al cargar el estado del chat:", error);
        }

        if (data) {
          setChatStatus(data.status as ChatStatus);
          setQuoteCount(data.quote_count || 0);
        } else {
          setChatStatus("initial");
          setQuoteCount(0);
        }
      } catch {
        // Silenciosamente manejamos cualquier error
        setChatStatus("initial");
        setQuoteCount(0);
      }
    }

    // Ejecutar la verificación inmediatamente
    loadChatStatus();

    // Configurar un intervalo para verificar periódicamente
    const intervalId = setInterval(loadChatStatus, 5000); // Verificar cada 5 segundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, [sessionId, supabase]);

  // Verificar si existe información de prequote para este chat
  useEffect(() => {
    async function checkPrequote() {
      if (!sessionId || !userId) {
        setHasPrequote(false);
        return;
      }

      const hasData = await hasPrequoteData(sessionId, userId);
      setHasPrequote(hasData);
    }

    // Ejecutar la verificación inmediatamente
    checkPrequote();

    // Configurar un intervalo para verificar periódicamente
    const intervalId = setInterval(checkPrequote, 5000); // Verificar cada 5 segundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, [sessionId, userId]);

  // Determinar qué iconos mostrar según el estado
  const showAppointmentIcon =
    chatStatus === "prequote" ||
    chatStatus === "appointment" ||
    chatStatus === "quote" ||
    chatStatus === "invoice";
  const showQuoteIcon =
    chatStatus === "appointment" ||
    chatStatus === "quote" ||
    chatStatus === "invoice";
  const showInvoiceIcon = chatStatus === "quote" || chatStatus === "invoice";

  // Determinar si los iconos están activos (completados)
  const isAppointmentActive =
    chatStatus !== "initial" && chatStatus !== "prequote";
  const isQuoteActive =
    chatStatus !== "initial" &&
    chatStatus !== "prequote" &&
    chatStatus !== "appointment";
  const isInvoiceActive = chatStatus === "invoice";

  // Función para ir a la página principal con chat limpio
  const handleNewChat = async () => {
    await clearChat();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background">
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center">
          <SidebarTrigger className="h-8 w-8" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            {/* Icono de Prequote Data que se muestra solo cuando hay datos en la tabla prequotes */}
            {hasPrequote && sessionId && userId && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-blue-500"
                      onClick={() => setPrequoteDialogOpen(true)}
                    >
                      <FileText className="h-5 w-5" />
                      <span className="sr-only">{t("prequoteData")}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("prequoteData")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Mostrar el icono de Appointment si ya tenemos prequote o más avanzado */}
            {showAppointmentIcon && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9",
                        isAppointmentActive && "text-green-500"
                      )}
                    >
                      <Calendar className="h-5 w-5" />
                      <span className="sr-only">{t("appointment")}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("appointment")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Mostrar el icono de Quote si ya tenemos appointment o más avanzado */}
            {showQuoteIcon && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 relative",
                        isQuoteActive && "text-green-500"
                      )}
                    >
                      <Search className="h-5 w-5" />
                      {quoteCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          {quoteCount}
                        </span>
                      )}
                      <span className="sr-only">{t("quote")}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("quote")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Mostrar el icono de Invoice si ya tenemos quote o más avanzado */}
            {showInvoiceIcon && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9",
                        isInvoiceActive && "text-green-500"
                      )}
                    >
                      <Receipt className="h-5 w-5" />
                      <span className="sr-only">{t("invoice")}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("invoice")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleNewChat}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="sr-only">{t("chat")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("newChat")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Diálogo para mostrar la información de prequote */}
      {userId && sessionId && (
        <PrequoteDialog
          open={prequoteDialogOpen}
          onOpenChange={setPrequoteDialogOpen}
          sessionId={sessionId}
          userId={userId}
        />
      )}
    </nav>
  );
}
