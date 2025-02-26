"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface SettingsModalContextType {
  isOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SettingsModalContext = createContext<
  SettingsModalContextType | undefined
>(undefined);

export function SettingsModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Simplificamos al máximo las funciones
  const openSettingsModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    // Primero cerramos el modal
    setIsOpen(false);

    // Reseteamos la pestaña activa después de un tiempo
    if (activeTab !== "general") {
      // Usamos setTimeout para asegurar que el cierre del modal se complete primero
      setTimeout(() => {
        setActiveTab("general");
      }, 300);
    }
  }, [activeTab]);

  // Memoizamos el valor del contexto para evitar renderizaciones innecesarias
  const contextValue = React.useMemo(
    () => ({
      isOpen,
      openSettingsModal,
      closeSettingsModal,
      activeTab,
      setActiveTab,
    }),
    [isOpen, openSettingsModal, closeSettingsModal, activeTab, setActiveTab]
  );

  return (
    <SettingsModalContext.Provider value={contextValue}>
      {children}
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal() {
  const context = useContext(SettingsModalContext);
  if (context === undefined) {
    throw new Error(
      "useSettingsModal must be used within a SettingsModalProvider"
    );
  }
  return context;
}
