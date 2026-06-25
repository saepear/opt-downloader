"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fadeUp, staggerChildren } from "@/lib/animations";

const FEATURES = [
  {
    title: "Multiplataforma",
    body: "YouTube, Spotify, SoundCloud, Bandcamp y más — un solo motor: yt-dlp.",
  },
  {
    title: "Sin pérdida",
    body: "MP3 320kbps vía ffmpeg, o conserva el mejor formato nativo disponible.",
  },
  {
    title: "Privado",
    body: "Tus descargas no se comparten. Historial cifrado, limpieza automática.",
  },
];

export function Hero() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    if (titleRef.current) fadeUp(titleRef.current, 0.1);
    if (subRef.current) fadeUp(subRef.current, 0.3);
    if (ctaRef.current) fadeUp(ctaRef.current, 0.45);
    if (cardsRef.current) staggerChildren(cardsRef.current, ":scope > *");
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col items-center gap-10 max-w-4xl w-full">
      <h1
        ref={titleRef}
        className="text-5xl sm:text-6xl font-bold tracking-tight text-center bg-gradient-to-r from-fuchsia-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent"
      >
        MP3 Downloader
      </h1>
      <p
        ref={subRef}
        className="text-lg text-foreground/70 text-center max-w-xl"
      >
        Pega un enlace, elige formato, descarga. Música desde cualquier
        plataforma, sin rodeos.
      </p>
      <div ref={ctaRef} className="flex gap-3">
        <Button magnetic onClick={() => window.scrollTo({ top: 0 })}>
          Empezar
        </Button>
        <Button variant="ghost" magnetic onClick={() => (window.location.href = "/history")}>
          Historial
        </Button>
      </div>

      <div
        ref={cardsRef}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8"
      >
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">{f.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}