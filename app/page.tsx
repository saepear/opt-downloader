"use client";

import { useState } from "react";
import { DownloadForm } from "@/components/DownloadForm";
import { Hero } from "@/components/Hero";
import { SearchPanel } from "@/components/SearchPanel";
import { PlaylistPreview } from "@/components/PlaylistPreview";
import type { AudioFormat } from "@/lib/types";
import toast from "react-hot-toast";

export default function Home() {
  const [targetUrl, setTargetUrl] = useState("");
  const [format, setFormat] = useState<AudioFormat>("mp3-320");

  function handleSelectResult(url: string, title: string) {
    setTargetUrl(url);
    toast.success(`"${title}" seleccionado`);
  }

  return (
    <main className="flex flex-1 w-full flex-col items-center justify-start px-6 py-16 gap-10">
      <Hero />
      <SearchPanel onSelectResult={handleSelectResult} />
      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        <DownloadForm
          url={targetUrl}
          onUrlChange={setTargetUrl}
          onFormatChange={setFormat}
        />
        <PlaylistPreview url={targetUrl} format={format} />
      </div>
    </main>
  );
}
