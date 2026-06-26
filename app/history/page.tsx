"use client";

import { SessionProvider } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HistoryContent } from "@/components/HistoryContent";

export default function HistoryPage() {
  return (
    <SessionProvider>
      <Navbar />
      <HistoryContent />
      <Footer />
    </SessionProvider>
  );
}
