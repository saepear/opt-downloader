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
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLang } from "@/lib/i18n";

function LoginForm() {
  const { t } = useLang();
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
      toast.error(t("login.fill"));
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
      toast.error(t("login.invalid"));
      if (formRef) shake(formRef);
      return;
    }
    toast.success(t("login.welcome"));
    router.push(from);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold mb-1">{t("login.title")}</h1>
      <p className="text-sm text-foreground/60 mb-6">{t("login.subtitle")}</p>
      <form
        ref={setFormRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs uppercase tracking-wider text-foreground/70">
            {t("login.email")}
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
            {t("login.password")}
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
          {submitting ? t("login.logging_in") : t("login.submit")}
        </Button>
      </form>
      <p className="text-sm text-foreground/60 mt-6">
        {t("login.no_account")}{" "}
        <Link
          href="/register"
          className="text-fuchsia-400 hover:text-fuchsia-300 underline-offset-4 hover:underline"
        >
          {t("login.register")}
        </Link>
      </p>
    </Card>
  );
}

function LoginFallback() {
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
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-16 relative z-10">
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
