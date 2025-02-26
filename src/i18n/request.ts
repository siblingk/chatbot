import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

// Nombre de la cookie que almacena la preferencia de idioma del usuario
const LOCALE_COOKIE_NAME = "user_locale";

export default getRequestConfig(async () => {
  // Intentar obtener el idioma de la cookie
  let locale = "es"; // Idioma predeterminado

  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME);
    if (localeCookie?.value) {
      locale = localeCookie.value;
    }
  } catch (error) {
    console.error("Error al leer la cookie de idioma:", error);
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
