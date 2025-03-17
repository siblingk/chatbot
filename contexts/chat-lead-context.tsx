"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ChatLead, ChatStatus } from "@/types/chat";
import { createClient } from "@/utils/supabase/client";

interface ChatLeadContextType {
  chatLead: ChatLead | null;
  setChatLead: React.Dispatch<React.SetStateAction<ChatLead | null>>;
  updateChatStatus: (status: ChatStatus) => Promise<void>;
  updatePreQuoteData: (data: Record<string, unknown>) => Promise<void>;
  updateAppointmentData: (data: Record<string, unknown>) => Promise<void>;
  updateQuoteData: (data: Record<string, unknown>) => Promise<void>;
  updateInvoiceData: (data: Record<string, unknown>) => Promise<void>;
  isLoading: boolean;
}

const ChatLeadContext = createContext<ChatLeadContextType | null>(null);

export function ChatLeadProvider({
  children,
  sessionId,
}: {
  children: React.ReactNode;
  sessionId: string;
}) {
  const [chatLead, setChatLead] = useState<ChatLead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createClient();

  // Cargar el estado del chat al iniciar
  useEffect(() => {
    async function loadChatLead() {
      if (!sessionId) return;

      setIsLoading(true);

      // Verificar si ya existe un registro para esta sesión
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error al cargar el estado del chat:", error);
      }

      if (data) {
        // Convertir las fechas de string a Date
        const formattedData: ChatLead = {
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at),
          prequote_date: data.prequote_date
            ? new Date(data.prequote_date)
            : undefined,
          appointment_date: data.appointment_date
            ? new Date(data.appointment_date)
            : undefined,
          last_quote_date: data.last_quote_date
            ? new Date(data.last_quote_date)
            : undefined,
          invoice_date: data.invoice_date
            ? new Date(data.invoice_date)
            : undefined,
        };
        setChatLead(formattedData);
      } else {
        // Si no existe, obtener el user_id actual
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Crear un nuevo registro
          const { data: newChatLead, error: insertError } = await supabase
            .from("leads")
            .insert({
              session_id: sessionId,
              user_id: user.id,
              status: "initial",
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error al crear el estado del chat:", insertError);
          } else if (newChatLead) {
            const formattedData: ChatLead = {
              ...newChatLead,
              created_at: new Date(newChatLead.created_at),
              updated_at: new Date(newChatLead.updated_at),
            };
            setChatLead(formattedData);
          }
        }
      }

      setIsLoading(false);
    }

    loadChatLead();
  }, [sessionId, supabase]);

  // Actualizar el estado del chat
  const updateChatStatus = async (status: ChatStatus) => {
    if (!chatLead) return;

    setIsLoading(true);

    const updates: Record<string, unknown> = { status };

    // Actualizar la fecha correspondiente según el estado
    if (status === "prequote") {
      updates.prequote_date = new Date().toISOString();
    } else if (status === "appointment") {
      updates.appointment_date = new Date().toISOString();
    } else if (status === "quote") {
      updates.last_quote_date = new Date().toISOString();
      updates.quote_count = (chatLead.quote_count || 0) + 1;
    } else if (status === "invoice") {
      updates.invoice_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", chatLead.id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar el estado del chat:", error);
    } else if (data) {
      const formattedData: ChatLead = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        prequote_date: data.prequote_date
          ? new Date(data.prequote_date)
          : undefined,
        appointment_date: data.appointment_date
          ? new Date(data.appointment_date)
          : undefined,
        last_quote_date: data.last_quote_date
          ? new Date(data.last_quote_date)
          : undefined,
        invoice_date: data.invoice_date
          ? new Date(data.invoice_date)
          : undefined,
      };
      setChatLead(formattedData);
    }

    setIsLoading(false);
  };

  // Actualizar los datos de la prequote
  const updatePreQuoteData = async (data: Record<string, unknown>) => {
    if (!chatLead) return;

    setIsLoading(true);

    const { data: updatedData, error } = await supabase
      .from("leads")
      .update({
        prequote_data: data,
        prequote_date: new Date().toISOString(),
        status: "prequote",
      })
      .eq("id", chatLead.id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar los datos de prequote:", error);
    } else if (updatedData) {
      const formattedData: ChatLead = {
        ...updatedData,
        created_at: new Date(updatedData.created_at),
        updated_at: new Date(updatedData.updated_at),
        prequote_date: updatedData.prequote_date
          ? new Date(updatedData.prequote_date)
          : undefined,
        appointment_date: updatedData.appointment_date
          ? new Date(updatedData.appointment_date)
          : undefined,
        last_quote_date: updatedData.last_quote_date
          ? new Date(updatedData.last_quote_date)
          : undefined,
        invoice_date: updatedData.invoice_date
          ? new Date(updatedData.invoice_date)
          : undefined,
      };
      setChatLead(formattedData);
    }

    setIsLoading(false);
  };

  // Actualizar los datos de la cita
  const updateAppointmentData = async (data: Record<string, unknown>) => {
    if (!chatLead) return;

    setIsLoading(true);

    const { data: updatedData, error } = await supabase
      .from("leads")
      .update({
        appointment_data: data,
        appointment_date: new Date().toISOString(),
        status: "appointment",
      })
      .eq("id", chatLead.id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar los datos de la cita:", error);
    } else if (updatedData) {
      const formattedData: ChatLead = {
        ...updatedData,
        created_at: new Date(updatedData.created_at),
        updated_at: new Date(updatedData.updated_at),
        prequote_date: updatedData.prequote_date
          ? new Date(updatedData.prequote_date)
          : undefined,
        appointment_date: updatedData.appointment_date
          ? new Date(updatedData.appointment_date)
          : undefined,
        last_quote_date: updatedData.last_quote_date
          ? new Date(updatedData.last_quote_date)
          : undefined,
        invoice_date: updatedData.invoice_date
          ? new Date(updatedData.invoice_date)
          : undefined,
      };
      setChatLead(formattedData);
    }

    setIsLoading(false);
  };

  // Actualizar los datos de la cotización
  const updateQuoteData = async (data: Record<string, unknown>) => {
    if (!chatLead) return;

    setIsLoading(true);

    const { data: updatedData, error } = await supabase
      .from("leads")
      .update({
        quote_data: data,
        last_quote_date: new Date().toISOString(),
        quote_count: (chatLead.quote_count || 0) + 1,
        status: "quote",
      })
      .eq("id", chatLead.id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar los datos de la cotización:", error);
    } else if (updatedData) {
      const formattedData: ChatLead = {
        ...updatedData,
        created_at: new Date(updatedData.created_at),
        updated_at: new Date(updatedData.updated_at),
        prequote_date: updatedData.prequote_date
          ? new Date(updatedData.prequote_date)
          : undefined,
        appointment_date: updatedData.appointment_date
          ? new Date(updatedData.appointment_date)
          : undefined,
        last_quote_date: updatedData.last_quote_date
          ? new Date(updatedData.last_quote_date)
          : undefined,
        invoice_date: updatedData.invoice_date
          ? new Date(updatedData.invoice_date)
          : undefined,
      };
      setChatLead(formattedData);
    }

    setIsLoading(false);
  };

  // Actualizar los datos de la factura
  const updateInvoiceData = async (data: Record<string, unknown>) => {
    if (!chatLead) return;

    setIsLoading(true);

    const { data: updatedData, error } = await supabase
      .from("leads")
      .update({
        invoice_data: data,
        invoice_date: new Date().toISOString(),
        status: "invoice",
      })
      .eq("id", chatLead.id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar los datos de la factura:", error);
    } else if (updatedData) {
      const formattedData: ChatLead = {
        ...updatedData,
        created_at: new Date(updatedData.created_at),
        updated_at: new Date(updatedData.updated_at),
        prequote_date: updatedData.prequote_date
          ? new Date(updatedData.prequote_date)
          : undefined,
        appointment_date: updatedData.appointment_date
          ? new Date(updatedData.appointment_date)
          : undefined,
        last_quote_date: updatedData.last_quote_date
          ? new Date(updatedData.last_quote_date)
          : undefined,
        invoice_date: updatedData.invoice_date
          ? new Date(updatedData.invoice_date)
          : undefined,
      };
      setChatLead(formattedData);
    }

    setIsLoading(false);
  };

  return (
    <ChatLeadContext.Provider
      value={{
        chatLead,
        setChatLead,
        updateChatStatus,
        updatePreQuoteData,
        updateAppointmentData,
        updateQuoteData,
        updateInvoiceData,
        isLoading,
      }}
    >
      {children}
    </ChatLeadContext.Provider>
  );
}

export function useChatLead() {
  const context = useContext(ChatLeadContext);
  if (!context) {
    throw new Error("useChatLead debe ser usado dentro de un ChatLeadProvider");
  }
  return context;
}
