"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
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
  const isClosingRef = useRef(false);
  const isChangingTabRef = useRef(false);

  // Función simplificada para abrir el modal
  const openSettingsModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Función simplificada para cerrar el modal
  const closeSettingsModal = useCallback(() => {
    // Evitamos múltiples cierres
    if (isClosingRef.current) return;

    isClosingRef.current = true;
    setIsOpen(false);

    // Reseteamos la referencia después de un tiempo
    setTimeout(() => {
      setActiveTab("general");
      isClosingRef.current = false;
    }, 500);
  }, []);

  // Función simplificada para cambiar la pestaña
  const handleSetActiveTab = useCallback((tab: string) => {
    if (isClosingRef.current || isChangingTabRef.current) return;

    isChangingTabRef.current = true;
    setActiveTab(tab);

    // Reseteamos la referencia después de un tiempo
    setTimeout(() => {
      isChangingTabRef.current = false;
    }, 100);
  }, []);

  // Memoizamos el valor del contexto
  const contextValue = React.useMemo(
    () => ({
      isOpen,
      openSettingsModal,
      closeSettingsModal,
      activeTab,
      setActiveTab: handleSetActiveTab,
    }),
    [
      isOpen,
      openSettingsModal,
      closeSettingsModal,
      activeTab,
      handleSetActiveTab,
    ]
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
