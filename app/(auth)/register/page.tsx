"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function RegisterPage() {
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formRef, setFormRef] = useState<HTMLFormElement | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || password.length < 8) {
      if (formRef) shake(formRef);
      toast.error(t("register.password_short"));
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      toast.error(body.message ?? body.error ?? t("register.auto_login_failed"));
      if (formRef) shake(formRef);
      setSubmitting(false);
      return;
    }
    const loginRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);
    if (!loginRes || loginRes.error) {
      toast.error(t("register.auto_login_failed"));
      router.push("/login");
      return;
    }
    toast.success(t("register.created"));
    router.push("/history");
    router.refresh();
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-16 relative z-10">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-1">{t("register.title")}</h1>
          <p className="text-sm text-foreground/60 mb-6">{t("register.subtitle")}</p>
          <form
            ref={setFormRef}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs uppercase tracking-wider text-foreground/70">
                {t("register.name")}
              </label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-wider text-foreground/70">
                {t("register.email")}
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
                {t("register.password")}
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
              <span className="text-xs text-foreground/50">{t("register.min_chars")}</span>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("register.creating") : t("register.submit")}
            </Button>
          </form>
          <p className="text-sm text-foreground/60 mt-6">
            {t("register.has_account")}{" "}
            <Link
              href="/login"
              className="text-fuchsia-400 hover:text-fuchsia-300 underline-offset-4 hover:underline"
            >
              {t("register.login")}
            </Link>
          </p>
        </Card>
      </main>
      <Footer />
    </>
  );
}
