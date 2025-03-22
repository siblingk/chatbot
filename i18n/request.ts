import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Nombre de la cookie que almacena la preferencia de idioma del usuario
const LOCALE_COOKIE_NAME = "user_locale";

export default getRequestConfig(async () => {
  // Intentar obtener el idioma de la cookie
  let locale = "en"; // Idioma predeterminado

  try {
    // Usar un bloque try-catch para manejar posibles errores al acceder a las cookies
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME);
    if (localeCookie?.value) {
      locale = localeCookie.value;
    }
  } catch (error) {
    // Si hay un error al acceder a las cookies, simplemente usamos el idioma predeterminado
    console.error("Error al leer la cookie de idioma:", error);
  }

  // Cargar los mensajes para el idioma seleccionado
  try {
    const messages = (await import(`./${locale}.json`)).default;
    return { locale, messages };
  } catch (error) {
    // Si hay un error al cargar los mensajes, volvemos al idioma predeterminado
    console.error(
      `Error al cargar los mensajes para el idioma ${locale}:`,
      error
    );
    const defaultMessages = (await import(`./en.json`)).default;
    return { locale: "en", messages: defaultMessages };
  }
});
