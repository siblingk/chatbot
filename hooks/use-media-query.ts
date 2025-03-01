"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verificar si estamos en el navegador
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia(query);

    // Establecer el estado inicial
    setMatches(media.matches);

    // Definir el callback para actualizar el estado cuando cambie el media query
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Agregar el listener
    media.addEventListener("change", listener);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}
