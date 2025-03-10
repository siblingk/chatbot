import { redirect } from "next/navigation";

export default function Default() {
  // Redirigir a la página principal cuando se accede directamente a /chat
  redirect("/");
}
