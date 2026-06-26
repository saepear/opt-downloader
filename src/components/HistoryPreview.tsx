"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLang } from "@/lib/i18n";

interface RecentDownload {
  title: string;
  platform: string | null;
  format: string;
  createdAt: string;
}

function timeAgo(dateStr: string, lang: "es" | "en"): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return lang === "es" ? "hace segundos" : "seconds ago";
  const min = Math.floor(sec / 60);
  if (min < 60) return lang === "es" ? `hace ${min} min` : `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return lang === "es" ? `hace ${hrs} h` : `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return lang === "es" ? `hace ${days} d` : `${days} d ago`;
}

function isRecent(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 120_000;
}

function PreviewRow({
  index,
  title,
  platform,
  format,
  ago,
  recent,
}: {
  index: number;
  title: string;
  platform: string | null;
  format: string;
  ago: string;
  recent: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const tween = gsap.fromTo(
      ref.current,
      { x: -16, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.6,
        delay: 0.3 + index * 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 85%", toggleActions: "play none none reverse" },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
    };
  }, [index]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-3 py-3 px-3 rounded-[var(--radius-md)] transition-colors duration-200"
      style={{
        borderTop: index > 0 ? "1px solid var(--border)" : "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        className="w-9 h-9 rounded-[8px] shrink-0"
        style={{
          background:
            index % 2 === 0
              ? "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(34,211,238,0.1))"
              : "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(168,85,247,0.08))",
          border: "1px solid var(--border)",
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-[550] text-[var(--fg)] truncate">{title}</div>
        <div className="text-[11px] text-[var(--muted)] flex items-center gap-2 mt-0.5">
          <span>{platform ?? "Unknown"}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{format}</span>
        </div>
      </div>
      <div className="text-[11px] text-[var(--muted)] hidden sm:block">{ago}</div>
      <span
        className="text-[10px] font-[600] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full"
        style={{
          background: recent
            ? "rgba(34,211,238,0.12)"
            : "rgba(168,85,247,0.12)",
          border: recent
            ? "1px solid rgba(34,211,238,0.25)"
            : "1px solid rgba(168,85,247,0.25)",
          color: recent ? "var(--cyan)" : "var(--accent)",
          letterSpacing: "0.05em",
        }}
      >
        {recent ? "● Live" : "Ready"}
      </span>
    </div>
  );
}

export function HistoryPreview() {
  const { t, lang } = useLang();
  const [downloads, setDownloads] = useState<RecentDownload[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch("/api/recent-downloads");
        if (res.ok) setDownloads(await res.json());
      } catch {
        // ignore
      }
    }
    fetchRecent();
    const interval = setInterval(fetchRecent, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="history-preview">
      <div className="section-wrap">
        <div className="text-center mb-12">
          <div className="section-label">{t("history.label")}</div>
          <h2 className="section-title">{t("history.title")}</h2>
          <p className="section-sub mx-auto" style={{ margin: "0 auto" }}>
            {t("history.subtitle")}
          </p>
        </div>

        <div className="max-w-[640px] mx-auto">
          <div
            className="glass-card rounded-[var(--radius-xl)] p-6 relative overflow-hidden"
            style={{
              border: "1px solid var(--border)",
            }}
          >
            {/* glow halo */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 200,
                height: 200,
                background:
                  "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--cyan)",
                    boxShadow: "0 0 10px var(--cyan-glow-strong)",
                    animation: "counter-pop 0.6s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1))",
                  }}
                />
                <span
                  className="text-[11px] uppercase tracking-[0.08em] text-[var(--cyan)]"
                  style={{ fontWeight: 600 }}
                >
                  {t("history.live")}
                </span>
              </div>
              <Link
                href="/history"
                className="text-[12px] font-[510] text-[var(--accent)] opacity-80 hover:opacity-100 transition-opacity inline-flex items-center gap-1"
              >
                {t("history.view_all")}
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="flex flex-col relative z-10">
              {downloads.length === 0 ? (
                <div className="py-6 text-center text-sm text-[var(--muted)]">
                  {t("history.empty_desc")}
                </div>
              ) : (
                downloads.map((d, i) => (
                  <PreviewRow
                    key={`${d.title}-${d.createdAt}`}
                    index={i}
                    title={d.title}
                    platform={d.platform}
                    format={d.format}
                    ago={timeAgo(d.createdAt, lang)}
                    recent={isRecent(d.createdAt)}
                  />
                ))
              )}
            </div>

            <div
              className="mt-5 pt-5 relative z-10"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-xs text-[var(--muted)] mb-3 text-center">
                {t("history.cta_text")}
              </p>
              <Link
                href="/login"
                className="group flex items-center justify-center gap-2 w-full py-3 rounded-[var(--radius-md)] text-sm font-[600] transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,211,238,0.08))",
                  border: "1px solid rgba(168,85,247,0.3)",
                  color: "var(--fg)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.15))";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(168,85,247,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,211,238,0.08))";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {t("history.cta")}
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
