import { redirect } from "next/navigation";

export default async function SettingsPage() {
  // Redirigimos a la página principal, ya que ahora el modal se abre desde el sidebar
  redirect("/");
}
