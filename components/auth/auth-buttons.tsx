"use client";
import { LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { signIn, signOut } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SignInButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (formData: FormData) => {
    setError("");
    const result = await signIn(formData);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          Iniciar Sesión
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Sesión</DialogTitle>
          <DialogDescription>
            Ingresa tus credenciales para acceder a tu cuenta
          </DialogDescription>
        </DialogHeader>
        <form action={handleSignIn} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Input
              type="email"
              name="email"
              placeholder="correo@ejemplo.com"
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Contraseña"
              required
            />
          </div>
          <button type="submit" className="w-full">
            Iniciar Sesión
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit">Cerrar Sesión</button>
    </form>
  );
}
