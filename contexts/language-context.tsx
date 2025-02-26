"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type LanguageContextType = {
  locale: string;
  setLocale: (locale: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>("es");
  const [isClient, setIsClient] = useState(false);

  // Verificar si estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cargar la preferencia de idioma del usuario al iniciar
  useEffect(() => {
    if (isClient) {
      // Intentar obtener el idioma de la cookie
      const cookies = document.cookie.split(";");
      const localeCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("user_locale=")
      );

      if (localeCookie) {
        const localeValue = localeCookie.split("=")[1];
        setLocaleState(localeValue);
      } else {
        // Si no hay cookie, usar el idioma del documento
        const htmlLang = document.documentElement.lang;
        if (htmlLang) {
          setLocaleState(htmlLang);
        }
      }
    }
  }, [isClient]);

  // Función para cambiar el idioma
  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    document.cookie = `user_locale=${newLocale}; path=/; max-age=${
      60 * 60 * 24 * 365
    }`;
    window.location.reload();
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
