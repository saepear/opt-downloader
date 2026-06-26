"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchPanel } from "@/components/SearchPanel";
import { DownloadForm } from "@/components/DownloadForm";
import { PlaylistPreview } from "@/components/PlaylistPreview";
import { Footer } from "@/components/Footer";
import { useLang } from "@/lib/i18n";
import type { AudioFormat } from "@/lib/types";
import toast from "react-hot-toast";

export default function SearchPage() {
  const { t } = useLang();
  const [targetUrl, setTargetUrl] = useState("");
  const [format, setFormat] = useState<AudioFormat>("mp3-320");

  function handleSelectResult(url: string, title: string) {
    setTargetUrl(url);
    toast.success(`"${title}" ${t("search.selected")}`);
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-center pt-[100px] px-6 pb-16 relative z-10">
        <h1 className="text-3xl font-[650] tracking-tight mb-8">{t("search.title")}</h1>
        <SearchPanel onSelectResult={handleSelectResult} />
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl mt-8">
          <DownloadForm
            url={targetUrl}
            onUrlChange={setTargetUrl}
            onFormatChange={setFormat}
          />
          <PlaylistPreview url={targetUrl} format={format} />
        </div>
      </main>
      <Footer />
    </>
  );
}
