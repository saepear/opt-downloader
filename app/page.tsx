"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { DownloadForm } from "@/components/DownloadForm";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PlatformsMarquee } from "@/components/PlatformsMarquee";
import { HowItWorks } from "@/components/HowItWorks";
import { HistoryPreview } from "@/components/HistoryPreview";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { NotesBackground } from "@/components/NotesBackground";
import type { AudioFormat } from "@/lib/types";

export default function Home() {
  const [targetUrl, setTargetUrl] = useState("");
  const [, setFormat] = useState<AudioFormat>("mp3-320");

  return (
    <>
      <Navbar />
      <NotesBackground />
      <main className="flex flex-1 flex-col relative z-10">
        <Hero />
        <DownloadForm
          url={targetUrl}
          onUrlChange={setTargetUrl}
          onFormatChange={setFormat}
        />
        <FeaturesSection />
        <PlatformsMarquee />
        <HowItWorks />
        <HistoryPreview />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
