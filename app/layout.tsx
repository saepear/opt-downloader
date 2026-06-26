import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/Toast";
import { BackgroundCanvas } from "@/components/BackgroundCanvas";
import { LangProvider, type Lang } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PureMP3 — Download MP3 From Any Platform",
  description: "Descarga música desde YouTube, Spotify, SoundCloud y más.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("puremp3-lang")?.value;
  const initialLang: Lang | undefined =
    langCookie === "en" || langCookie === "es" ? langCookie : undefined;

  return (
    <html
      lang={initialLang ?? "es"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BackgroundCanvas />
        <LangProvider initialLang={initialLang}>
          {children}
        </LangProvider>
        <Toaster />
      </body>
    </html>
  );
}
