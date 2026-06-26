"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { detectPlatform, type PlatformInfo } from "@/lib/platforms";
import type { AudioFormat, DownloadStatus } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import toast from "react-hot-toast";

function IconSvg({
  d,
  size = 18,
  strokeWidth = 2,
  paths,
}: {
  d?: string;
  paths?: string[];
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 inline-block"
      style={{ width: size, height: size }}
    >
      {d && <path d={d} />}
      {paths?.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}

const ICONS = {
  paste: "M15 2H9a1 1 0 00-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1zM8 4H6a2 2 0 00-2 2v14c0 1.1.9 2 2 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M12 11h4M12 16h4M8 11h.01M8 16h.01",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  check: "M20 6L9 17l-5-5",
  alert: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4M12 16h.01",
  sparkle: "M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2z",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
};

/**
 * Render oficial del icono de una plataforma detectada.
 * - Si `platform.paths` está vacío (generic / unknown) → icono link muted
 * - Si tiene 1 path → icono monocromático con `currentColor = platform.color`
 * - Si tiene 2 paths (TikTok dual-color) → renderiza ambos con colores
 *   cyan (#25F4EE) + rosa (#FE2C55) en <g> superpuestos
 */
function PlatformIcon({
  platform,
  size = 14,
}: {
  platform: PlatformInfo;
  size?: number;
}) {
  if (!platform.paths.length) {
    return (
      <IconSvg d={ICONS.link} size={size} strokeWidth={2} />
    );
  }
  const offset = platform.id === "tiktok" ? 0.6 : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      style={{
        width: size,
        height: size,
        color: platform.color,
        flexShrink: 0,
        display: "inline-block",
      }}
    >
      {platform.id === "tiktok" ? (
        <>
          <path
            d={platform.paths[0]}
            style={{ color: "#25F4EE", transform: `translate(-${offset}px, 0)` }}
          />
          <path
            d={platform.paths[1]}
            style={{ color: "#FE2C55", transform: `translate(${offset}px, 0)` }}
          />
        </>
      ) : (
        platform.paths.map((p, i) => <path key={i} d={p} />)
      )}
    </svg>
  );
}

/* ============================================================
   ANIMATED WAVEFORM INSIDE INPUT
   - Renders N vertical bars whose height is derived from a hash
     of the typed URL length, then animates with `wave-react`.
   - The animation is re-keyed when the URL changes so the bars
     "rearrange" smoothly.
   ============================================================ */
function InputWaveform({ active, intensity }: { active: boolean; intensity: number }) {
  const BARS = 28;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const bars = ref.current.querySelectorAll<HTMLDivElement>(".input-wave-bar");
    const amp = Math.max(0.18, Math.min(1, intensity));
    bars.forEach((bar, i) => {
      const seed = Math.sin(i * 1.3 + intensity * 5) * 0.5 + 0.5;
      const baseHeight = 4 + seed * (active ? 14 * amp : 4);
      bar.style.height = `${baseHeight}px`;
      bar.style.opacity = active ? `${0.4 + seed * 0.55}` : "0.18";
      // re-key animation so bars visibly bounce to new heights
      bar.style.animation = "none";
      // force reflow
      void bar.offsetWidth;
      bar.style.animation = `wave-react ${0.55 + Math.random() * 0.5}s ease-in-out ${i * 0.04}s infinite`;
    });
  }, [active, intensity, BARS]);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        height: 24,
        padding: "0 4px",
        opacity: active ? 1 : 0.5,
        transition: "opacity 0.3s",
      }}
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <div
          key={i}
          className="input-wave-bar"
          style={{
            width: 2,
            borderRadius: 1,
            background:
              "linear-gradient(180deg, var(--cyan), var(--accent))",
            transformOrigin: "center",
            willChange: "transform, height",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   MINI WAVEFORM inside the preview row (more detailed SVG).
   Drawn with SVG paths for crisp rendering at small sizes.
   ============================================================ */
function MiniWaveform({ url, format }: { url: string; format: AudioFormat }) {
  const bars = 36;
  // Derive a deterministic height value per bar from the URL.
  // No mutation: each call computes the full seed fresh from the url string.
  const heights = useMemo(() => {
    const out: number[] = [];
    let h = 0;
    for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
    for (let i = 0; i < bars; i++) {
      h = (h * 1664525 + 1013904223) >>> 0;
      const r = (h % 1000) / 1000;
      out.push(6 + Math.abs(Math.sin(i * 0.4 + r * 6)) * 26);
    }
    return out;
    // `format` is referenced for visual coherence; ESLint may flag, OK to silence:
    // we want the wave to react to BOTH url and format changes.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [url, format]);

  return (
    <svg
      width={120}
      height={36}
      viewBox="0 0 120 36"
      preserveAspectRatio="none"
      aria-hidden
      style={{ display: "block" }}
    >
      {heights.map((height, i) => {
        const x = (i / bars) * 120 + 1;
        const y = 18 - height / 2;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={1.5}
            height={height}
            rx={0.75}
            fill="url(#mini-wave-grad)"
          />
        );
      })}
      <defs>
        <linearGradient id="mini-wave-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.85} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.85} />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FormatIcon({ format }: { format: AudioFormat }) {
  if (format === "mp3-320") {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x={3} y={6} width={3} height={12} rx={1.5} fill="currentColor" />
        <rect x={8} y={3} width={3} height={18} rx={1.5} fill="currentColor" opacity={0.7} />
        <rect x={13} y={8} width={3} height={8} rx={1.5} fill="currentColor" />
        <rect x={18} y={5} width={3} height={14} rx={1.5} fill="currentColor" opacity={0.85} />
      </svg>
    );
  }
  if (format === "best") {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.5-.5L12 2z" fill="currentColor" />
      </svg>
    );
  }
  if (format === "wav") {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <circle cx={10} cy={12} r={2.5} fill="currentColor" />
      </svg>
    );
  }
  // flac
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x={3} y={9} width={18} height={6} rx={3} fill="currentColor" opacity={0.85} />
      <rect x={6} y={11} width={3} height={2} rx={1} fill="var(--bg)" />
      <rect x={10} y={11} width={3} height={2} rx={1} fill="var(--bg)" />
      <rect x={14} y={11} width={3} height={2} rx={1} fill="var(--bg)" />
    </svg>
  );
}

function StepDot({ n, label, state }: { n: number; label: string; state: "done" | "active" | "pending" }) {
  const bg =
    state === "active"
      ? "linear-gradient(135deg, var(--accent), var(--cyan))"
      : state === "done"
        ? "rgba(168,85,247,0.3)"
        : "rgba(255,255,255,0.04)";
  const fg = state === "pending" ? "var(--muted)" : "var(--fg)";
  return (
    <div
      className="inline-flex items-center gap-2"
      style={{
        opacity: state === "pending" ? 0.55 : 1,
        transition: "opacity 0.4s",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: bg,
          color: state === "pending" ? "var(--muted)" : "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 650,
          boxShadow: state === "active" ? "0 0 18px rgba(168,85,247,0.5)" : "none",
          transition: "background 0.4s, box-shadow 0.4s",
        }}
      >
        {state === "done" ? (
          <IconSvg d={ICONS.check} size={11} strokeWidth={3} />
        ) : (
          n
        )}
      </span>
      <span style={{ fontSize: 12, color: fg, fontWeight: 510 }}>{label}</span>
    </div>
  );
}

function platformFor(url: string): PlatformInfo {
  if (!url.trim())
    return {
      id: "unknown",
      name: "",
      host: "",
      pattern: /^$/,
      color: "#94a3b8",
      paths: [],
    };
  return detectPlatform(url);
}

interface DownloadFormProps {
  url?: string;
  onUrlChange?: (url: string) => void;
  onFormatChange?: (format: AudioFormat) => void;
}

export function DownloadForm({
  url: externalUrl,
  onUrlChange,
  onFormatChange,
}: DownloadFormProps) {
  const { t } = useLang();
  const url = externalUrl ?? "";
  const setUrl = useCallback(
    (next: string) => onUrlChange?.(next),
    [onUrlChange]
  );
  const [format, setFormat] = useState<AudioFormat>("mp3-320");
  const [status, setStatus] = useState<DownloadStatus | "idle">("idle");
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState(10);
  const [limit, setLimit] = useState(10);
  const [showPreview, setShowPreview] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const orbitRef = useRef<SVGSVGElement>(null);

  const platform = useMemo(() => platformFor(url), [url]);
  const isDrm = platform.hasDrm === true;

  // intensity derived from url length → drives waveform energy
  const intensity = useMemo(() => {
    const len = url.length;
    if (!len) return 0.15;
    return Math.min(1, 0.25 + len / 80);
  }, [url]);

  useEffect(() => {
    fetch("/api/download-limit")
      .then((r) => r.json())
      .then((d) => { setRemaining(d.remaining); setLimit(d.limit); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => sseRef.current?.close();
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.3 }
    );
  }, []);

  function isValidUrl(value: string) {
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setShowPreview(true);
      toast.success(t("df.url_detected"));
    } catch {
      toast.error(t("df.clipboard_error"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidUrl(url)) {
      toast.error(t("df.invalid_url"));
      return;
    }
    if (isDrm) {
      toast.error(`${platform.name} ${t("df.drm")}`);
      return;
    }

    setStatus("queued");
    setProgress(0);

    let jobId: string;
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        if (res.status === 429) {
          toast.error(t("df.limit"));
        } else {
          toast.error(body.message ?? body.error ?? t("df.error"));
        }
        setStatus("error");
        return;
      }

      const remainingRes = await fetch("/api/download-limit")
        .then((r) => r.json())
        .catch(() => ({ remaining: 0, limit: 10 }));
      setRemaining(remainingRes.remaining);
      setLimit(remainingRes.limit);

      const data = (await res.json()) as { jobId: string };
      jobId = data.jobId;
    } catch (err) {
      setStatus("error");
      toast.error((err as Error).message ?? t("df.network_error"));
      return;
    }

    const sse = new EventSource(`/api/progress/${jobId}`);
    sseRef.current = sse;

    sse.onmessage = (event) => {
      let job: {
        status: DownloadStatus | "removed";
        progress: number;
        error?: string;
        filename?: string;
        filepath?: string;
        contentType?: string;
      };
      try {
        job = JSON.parse(event.data);
      } catch {
        return;
      }

      setStatus(job.status === "removed" ? "error" : job.status);
      setProgress(job.progress ?? 0);

      if (job.status === "error") {
        sse.close();
        sseRef.current = null;
        toast.error(job.error ?? t("df.error"));
        return;
      }

      if (job.status === "ready") {
        sse.close();
        sseRef.current = null;
        setProgress(100);
        triggerDownload(jobId, job.filename);
      }
    };

    sse.onerror = () => {
      sse.close();
      sseRef.current = null;
      setStatus("error");
      toast.error(t("df.connection_lost"));
    };
  }

  async function triggerDownload(jobId: string, filename?: string) {
    try {
      const res = await fetch(`/api/download/${jobId}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        toast.error(body.message ?? t("df.error"));
        setStatus("error");
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename ?? `download.${format === "mp3-320" ? "mp3" : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      setStatus("ready");
      toast.success(t("df.download_ready"));
      setTimeout(() => {
        setStatus("idle");
        setProgress(0);
      }, 1500);
    } catch (err) {
      setStatus("error");
      toast.error((err as Error).message ?? t("df.network_error"));
    }
  }

  const isBusy =
    status !== "idle" && status !== "ready" && status !== "error";
  const limitPercent = (remaining / limit) * 100;

  const statusText = useMemo(() => {
    switch (status) {
      case "queued":
        return t("df.queued");
      case "fetching":
        return t("df.fetching");
      case "downloading":
        return t("df.downloading", { n: progress });
      case "converting":
        return t("df.converting");
      default:
        return "";
    }
  }, [status, progress, t]);

  // step state for indicator
  const stepState = (idx: number): "done" | "active" | "pending" => {
    if (idx === 0) {
      // paste step: done if URL is valid
      return isValidUrl(url) ? "done" : isFocused ? "active" : "pending";
    }
    if (idx === 1) {
      // quality step
      if (!isValidUrl(url)) return "pending";
      if (isBusy) return "active";
      return "done";
    }
    // download step
    if (!isValidUrl(url)) return "pending";
    if (isBusy || status === "ready") return "active";
    return "pending";
  };

  return (
    <div className="relative z-10 px-6 pb-20">
      <div
        ref={cardRef}
        className="relative max-w-[760px] mx-auto"
        style={{ isolation: "isolate" }}
      >
        {/* musical note — replaces the gradient orbit border */}
        <svg
          ref={orbitRef}
          aria-hidden
          className="df-note"
          data-mode="orbit"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 18V5l12-2v13"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="6"
            cy="18"
            r="3"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="currentColor"
            fillOpacity="0.18"
          />
          <circle
            cx="18"
            cy="16"
            r="3"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="currentColor"
            fillOpacity="0.18"
          />
        </svg>
        <div
          className="relative"
          style={{
            background: "rgba(10,10,16,0.55)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: "1px solid var(--border-active)",
            borderRadius: "var(--radius-xl)",
            padding: "28px 28px 24px",
            boxShadow:
              "0 0 80px rgba(168,85,247,0.10), 0 0 40px rgba(34,211,238,0.05), 0 30px 80px rgba(0,0,0,0.55)",
          }}
        >
          {/* Step indicator */}
          <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <StepDot n={1} label={t("df.step.paste")} state={stepState(0)} />
              <span
                aria-hidden
                style={{
                  width: 16,
                  height: 1,
                  background:
                    "linear-gradient(90deg, var(--border-active), transparent)",
                }}
              />
              <StepDot n={2} label={t("df.step.quality")} state={stepState(1)} />
              <span
                aria-hidden
                style={{
                  width: 16,
                  height: 1,
                  background:
                    "linear-gradient(90deg, var(--border-active), transparent)",
                }}
              />
              <StepDot n={3} label={t("df.step.download")} state={stepState(2)} />
            </div>
            <span
              className="text-[11px] text-[var(--muted)] hidden sm:inline-flex items-center gap-1.5"
              style={{ letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 510 }}
            >
              <IconSvg d={ICONS.sparkle} size={11} strokeWidth={2.5} />
              {t("df.step.tag")}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* URL input + paste button */}
            <div
              className="flex gap-2 items-center rounded-[var(--radius-md)]"
              style={{
                background: "rgba(0,0,0,0.55)",
                padding: "6px 6px 6px 18px",
                border: "1px solid",
                borderColor: url
                  ? isDrm
                    ? "rgba(251,191,36,0.6)"
                    : "var(--accent)"
                  : isFocused
                    ? "var(--border-active)"
                    : "var(--border)",
                transition: "border-color 0.3s, box-shadow 0.3s",
                boxShadow: url
                  ? isDrm
                    ? "0 0 0 4px rgba(251,191,36,0.12)"
                    : "0 0 0 4px rgba(168,85,247,0.16)"
                  : isFocused
                    ? "0 0 0 4px rgba(255,255,255,0.04)"
                    : "none",
              }}
            >
              <span style={{ color: "var(--muted)", display: "inline-flex" }}>
                <IconSvg d={ICONS.link} size={16} strokeWidth={2} />
              </span>
              <input
                type="text"
                placeholder={t("df.placeholder")}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (e.target.value) setShowPreview(true);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isBusy}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 h-[52px] text-[15px] font-[450] bg-transparent border-none outline-none text-[var(--fg)] placeholder:text-[var(--muted)]"
                style={{ letterSpacing: "-0.01em" }}
              />
              <InputWaveform active={isFocused || url.length > 0} intensity={intensity} />
              <button
                type="button"
                onClick={handlePaste}
                disabled={isBusy}
                className="h-[44px] px-4 rounded-[var(--radius-sm)] flex items-center gap-1.5 text-sm font-[510] transition-[background,color,border-color] duration-200"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--muted)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "var(--fg)";
                  e.currentTarget.style.borderColor = "var(--border-active)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "var(--muted)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <IconSvg d={ICONS.paste} size={14} />
                {t("df.paste")}
              </button>
            </div>

            {/* Platform indicator */}
            {platform.name && !isDrm && !platform.usesExternalTool && (
              <div
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full self-start"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                <PlatformIcon platform={platform} size={11} />
                <span>
                  {t("df.platform")}:{" "}
                  <strong style={{ color: "var(--fg)", fontWeight: 600 }}>
                    {platform.name}
                  </strong>
                </span>
              </div>
            )}
            {platform.usesExternalTool && (
              <div
                className="text-xs px-3 py-1.5 rounded-full self-start"
                style={{
                  background: "rgba(34,211,238,0.06)",
                  border: "1px solid rgba(34,211,238,0.18)",
                  color: "var(--cyan)",
                }}
              >
                {platform.name} {t("df.external")}
              </div>
            )}
            {isDrm && (
              <div
                className="text-xs px-3 py-1.5 rounded-full self-start inline-flex items-center gap-1.5"
                style={{
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  color: "#fbbf24",
                }}
              >
                <IconSvg d={ICONS.alert} size={11} strokeWidth={2.5} />
                <span>
                  {platform.name} {t("df.drm")}
                </span>
              </div>
            )}

            {/* Preview row */}
            {showPreview && url && status === "idle" && (
              <div
                className="p-[14px_16px] rounded-[var(--radius-md)] flex gap-3 items-center"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid var(--border)",
                  animation: "fade-up 0.35s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1))",
                }}
              >
                <div
                  className="w-[44px] h-[44px] rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.12))",
                    border: "1px solid rgba(168,85,247,0.2)",
                  }}
                >
                  <PlatformIcon platform={platform} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-[600] truncate mb-0.5"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {platform.name || "URL"} — {format.toUpperCase()}
                  </div>
                  <div className="text-xs text-[var(--muted)] flex gap-3 items-center">
                    <span>{platform.name || t("df.platform")}</span>
                    <span
                      aria-hidden
                      style={{
                        display: "inline-block",
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        background: "var(--muted)",
                        opacity: 0.6,
                      }}
                    />
                    <span>{format === "mp3-320" ? "320kbps" : format.toUpperCase()}</span>
                  </div>
                </div>
                <MiniWaveform url={url} format={format} />
              </div>
            )}

            {/* Quality selector */}
            <div
              className="flex gap-1 p-1 rounded-[var(--radius-md)]"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--border)" }}
            >
              {[
                { id: "mp3-320" as AudioFormat, label: t("df.mp3"), sub: t("df.mp3sub") },
                { id: "best" as AudioFormat, label: t("df.best"), sub: t("df.bestsub") },
                { id: "wav" as AudioFormat, label: t("df.wav"), sub: t("df.wavsub") },
                { id: "flac" as AudioFormat, label: t("df.flac"), sub: t("df.flacsub") },
              ].map((q) => {
                const active = format === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`segmented-btn flex-1 py-[10px] px-2 text-center rounded-[var(--radius-sm)] text-xs cursor-pointer inline-flex flex-col items-center gap-0.5 ${active ? "active" : ""}`}
                    onClick={() => {
                      setFormat(q.id);
                      onFormatChange?.(q.id);
                    }}
                    style={{
                      fontWeight: active ? 600 : 450,
                      color: active ? "var(--fg)" : "var(--muted)",
                      background: active
                        ? "rgba(168,85,247,0.2)"
                        : "transparent",
                      border: active
                        ? "1px solid rgba(168,85,247,0.35)"
                        : "1px solid transparent",
                      transition: "all 0.25s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1))",
                    }}
                    aria-pressed={active}
                  >
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{
                        color: active ? "var(--accent)" : "var(--muted)",
                        transition: "color 0.25s",
                      }}
                    >
                      <FormatIcon format={q.id} />
                      <span style={{ fontSize: 13 }}>{q.label}</span>
                    </span>
                    <span style={{ fontSize: 10.5, color: "var(--muted-light)", letterSpacing: "0.02em" }}>
                      {q.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Download button */}
            <button
              type="submit"
              disabled={isBusy || !url || isDrm}
              className="relative w-full h-[56px] rounded-[var(--radius-md)] text-[15px] font-[600] flex items-center justify-center gap-2.5 transition-[opacity,box-shadow,transform] duration-300 overflow-hidden active:scale-[0.99]"
              style={{
                background:
                  !url || isDrm
                    ? "rgba(255,255,255,0.04)"
                    : "linear-gradient(135deg, #a855f7 0%, #7c3aed 55%, #6d28d9 100%)",
                color: !url || isDrm ? "var(--muted)" : "#fff",
                cursor: !url || isDrm ? "not-allowed" : "pointer",
                boxShadow:
                  url && !isDrm
                    ? "0 0 0 1px rgba(168,85,247,0.35), 0 0 40px rgba(168,85,247,0.3), inset 0 1px 0 rgba(255,255,255,0.18)"
                    : "none",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                if (url && !isDrm) {
                  e.currentTarget.style.boxShadow =
                    "0 0 0 1px rgba(168,85,247,0.5), 0 0 60px rgba(168,85,247,0.45), inset 0 1px 0 rgba(255,255,255,0.22)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (url && !isDrm) {
                  e.currentTarget.style.boxShadow =
                    "0 0 0 1px rgba(168,85,247,0.35), 0 0 40px rgba(168,85,247,0.3), inset 0 1px 0 rgba(255,255,255,0.18)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {isBusy ? (
                <>
                  <span
                    className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-[spin_0.7s_linear_infinite]"
                    style={{ borderTopColor: "#fff" }}
                  />
                  <span>{statusText}</span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>·</span>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>{progress}%</span>
                </>
              ) : (
                <>
                  <IconSvg d={ICONS.download} size={18} strokeWidth={2.5} />
                  <span>{t("df.download")}</span>
                  <span
                    aria-hidden
                    style={{
                      marginLeft: 4,
                      display: "inline-flex",
                      opacity: 0.7,
                    }}
                  >
                    ↵
                  </span>
                </>
              )}
            </button>

            {/* Progress bar */}
            {isBusy && (
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-[400ms]"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, var(--cyan), var(--accent))",
                    boxShadow: "0 0 12px rgba(168,85,247,0.45)",
                  }}
                />
              </div>
            )}

            {/* Download limit bar */}
            {status === "idle" && (
              <div className="flex items-center justify-center gap-2.5 text-xs text-[var(--muted)]">
                <div
                  className="w-[120px] h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${limitPercent}%`,
                      background:
                        remaining > limit * 0.5
                          ? "linear-gradient(90deg, #22c55e, #16a34a)"
                          : remaining > limit * 0.2
                          ? "linear-gradient(90deg, #eab308, #ca8a04)"
                          : "linear-gradient(90deg, #ef4444, #dc2626)",
                      transition: "width 0.5s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1))",
                    }}
                  />
                </div>
                <span>
                  <strong style={{ color: "var(--fg)", fontWeight: 600 }}>
                    {t("df.remaining", { n: remaining, limit })}
                  </strong>
                </span>
              </div>
            )}

            {/* Status messages */}
            {status === "ready" && (
              <div className="flex items-center gap-2 justify-center text-sm text-emerald-400">
                <IconSvg d={ICONS.check} size={14} strokeWidth={3} />
                <span>{t("df.download_ready")}</span>
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 justify-center text-sm text-rose-400">
                <IconSvg d={ICONS.alert} size={14} />
                <span>{t("df.error")}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}