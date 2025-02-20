"use client";

import { RequireAdmin } from "@/components/auth/require-admin";

export default function SettingsPage() {
  return (
    <RequireAdmin>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Configuración</h1>
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Configuración General</h2>
          {/* Aquí irá el contenido de la configuración */}
          <p className="text-muted-foreground">
            Esta sección está en desarrollo. Pronto podrás gestionar la
            configuración del sistema.
          </p>
        </div>
      </div>
    </RequireAdmin>
  );
}
