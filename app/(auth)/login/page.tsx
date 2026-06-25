"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { shake } from "@/lib/animations";

/**
 * Next 16 obliga a envolver `useSearchParams()` en un Suspense boundary
 * (cambio breaking vs Next 14/15). Por eso separamos el componente real
 * del wrapper de Suspense.
 */

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/history";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formRef, setFormRef] = useState<HTMLFormElement | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      if (formRef) shake(formRef);
      toast.error("Completa email y contraseña");
      return;
    }
    setSubmitting(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);

    if (!res || res.error) {
      toast.error("Email o contraseña incorrectos");
      if (formRef) shake(formRef);
      return;
    }
    toast.success("Bienvenido");
    router.push(from);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold mb-1">Iniciar sesión</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Entra para ver tu historial y volver a descargar tus tracks.
      </p>
      <form
        ref={setFormRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs uppercase tracking-wider text-foreground/70">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs uppercase tracking-wider text-foreground/70">
            Contraseña
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <p className="text-sm text-foreground/60 mt-6">
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
          className="text-fuchsia-400 hover:text-fuchsia-300 underline-offset-4 hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </Card>
  );
}

function LoginFallback() {
  // Skeleton mínimo mientras el componente real se hidrata.
  return (
    <Card className="w-full max-w-md">
      <div className="h-7 w-40 bg-white/10 rounded mb-2" />
      <div className="h-4 w-64 bg-white/10 rounded mb-6" />
      <div className="h-10 w-full bg-white/10 rounded mb-3" />
      <div className="h-10 w-full bg-white/10 rounded mb-4" />
      <div className="h-10 w-full bg-white/10 rounded" />
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}