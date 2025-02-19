"use client";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { createClient } from "@/utils/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SignInButton() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex justify-start items-center"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Iniciar Sesión
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Sesión</DialogTitle>
          <DialogDescription>
            Ingresa tus credenciales para acceder a tu cuenta
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSignIn} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Iniciar Sesión
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SignUpButton() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data?.user && !data.user.email_confirmed_at) {
      setIsVerificationSent(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isVerificationSent) {
          setOpen(newOpen);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex justify-start items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Registrarse
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isVerificationSent ? "Verifica tu correo" : "Crear Cuenta"}
          </DialogTitle>
          <DialogDescription>
            {isVerificationSent
              ? "Te hemos enviado un correo de verificación. Por favor, revisa tu bandeja de entrada y sigue las instrucciones para verificar tu cuenta."
              : "Regístrate para acceder a todas las funcionalidades"}
          </DialogDescription>
        </DialogHeader>
        {!isVerificationSent ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              Registrarse
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                No podrás acceder a todas las funcionalidades hasta que
                verifiques tu correo electrónico.
              </AlertDescription>
            </Alert>
            <Button onClick={() => window.location.reload()} className="w-full">
              Recargar página
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
