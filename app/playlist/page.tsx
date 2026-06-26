"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { PlaylistPreview } from "@/components/PlaylistPreview";
import { Footer } from "@/components/Footer";
import { useLang } from "@/lib/i18n";
import type { AudioFormat } from "@/lib/types";

export default function PlaylistPage() {
  const { t } = useLang();
  const [url, setUrl] = useState("");
  const [format] = useState<AudioFormat>("mp3-320");

  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-center pt-[100px] px-6 pb-16 relative z-10">
        <h1 className="text-3xl font-[650] tracking-tight mb-2">{t("playlist.title")}</h1>
        <p className="text-sm text-[var(--muted)] mb-8 max-w-md text-center">{t("playlist.subtitle")}</p>
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <input
            type="text"
            placeholder={t("playlist.placeholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full h-[52px] px-[18px] text-[15px] font-[450] rounded-[var(--radius-md)] bg-[rgba(0,0,0,0.4)] border border-[var(--border)] text-[var(--fg)] outline-none transition-[border-color] duration-300"
          />
          <PlaylistPreview url={url} format={format} />
        </div>
      </main>
      <Footer />
    </>
  );
}
