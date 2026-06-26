"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

interface Download {
  id: string;
  title: string;
  artist: string | null;
  platform: string | null;
  format: string;
  status: string;
  errorCode: string | null;
  bytes: number | null;
  createdAt: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
  spotify: "Spotify",
  vimeo: "Vimeo",
  twitter: "X",
  tiktok: "TikTok",
  generic: "Audio",
  unknown: "?",
};

export function HistoryContent() {
  const { t, lang } = useLang();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?from=/history");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setDownloads(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <main className="flex flex-1 w-full items-start justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-4xl h-64" />
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="flex flex-1 w-full items-start justify-center px-6 py-12 relative z-10">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{t("history.page_title")}</h1>
            <p className="text-sm text-foreground/60 mt-1">
              {downloads.length === 0
                ? t("history.empty_desc")
                : t("history.last", { n: downloads.length })}
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-fuchsia-400 hover:text-fuchsia-300 underline-offset-4 hover:underline"
          >
            {t("history.back")}
          </Link>
        </header>

        {downloads.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-foreground/70">{t("history.start")}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-foreground/70 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">{t("history.col_title")}</th>
                  <th className="text-left px-4 py-3">{t("history.col_platform")}</th>
                  <th className="text-left px-4 py-3">{t("history.col_format")}</th>
                  <th className="text-left px-4 py-3">{t("history.col_status")}</th>
                  <th className="text-left px-4 py-3">{t("history.col_date")}</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 max-w-[260px] truncate">
                      <div className="font-medium">{d.title}</div>
                      {d.artist && (
                        <div className="text-xs text-foreground/50">{d.artist}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {PLATFORM_LABELS[d.platform ?? "unknown"] ?? d.platform}
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {d.format}
                    </td>
                    <td className="px-4 py-3">
                      {d.status === "completed" ? (
                        <span className="text-emerald-400">✓ {t("history.status_ready")}</span>
                      ) : (
                        <span className="text-rose-400" title={d.errorCode ?? ""}>
                          ✗ {d.errorCode ?? t("history.status_error")}
                        </span>
                      )}
                      {d.bytes !== null && d.bytes !== undefined && (
                        <span className="text-foreground/40 text-xs ml-2">
                          {(d.bytes / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground/60 text-xs">
                      {new Intl.DateTimeFormat(lang === "es" ? "es" : "en-US", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(d.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
