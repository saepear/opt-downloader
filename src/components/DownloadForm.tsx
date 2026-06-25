"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { shake } from "@/lib/animations";
import { detectPlatform, type PlatformInfo } from "@/lib/platforms";
import type { AudioFormat, DownloadStatus } from "@/lib/types";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<DownloadStatus, string> = {
  queued: "En cola…",
  fetching: "Obteniendo información…",
  downloading: "Descargando…",
  converting: "Procesando audio…",
  ready: "Listo",
  error: "Error",
  removed: "",
};

function platformFor(url: string): PlatformInfo {
  if (!url.trim()) {
    return { id: "unknown", name: "", host: "", pattern: /^$/ };
  }
  return detectPlatform(url);
}

interface DownloadFormProps {
  url?: string;
  onUrlChange?: (url: string) => void;
  onFormatChange?: (format: AudioFormat) => void;
}

export function DownloadForm({ url: externalUrl, onUrlChange, onFormatChange }: DownloadFormProps) {
  const url = externalUrl ?? "";
  const setUrl = useCallback(
    (next: string) => onUrlChange?.(next),
    [onUrlChange]
  );
  const [format, setFormat] = useState<AudioFormat>("mp3-320");
  const [status, setStatus] = useState<DownloadStatus | "idle">("idle");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const platform = useMemo(() => platformFor(url), [url]);
  const isDrm = platform.hasDrm === true;

  useEffect(() => {
    if (!progressBarRef.current) return;
    progressBarRef.current.style.transition = "width 0.4s ease";
    progressBarRef.current.style.width = `${progress}%`;
  }, [progress]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => sseRef.current?.close();
  }, []);

  function isValidUrl(value: string) {
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidUrl(url)) {
      if (inputRef.current) shake(inputRef.current);
      toast.error("Pega una URL válida (http/https)");
      return;
    }
    if (isDrm) {
      toast.error(`${platform.name} usa DRM y no se puede descargar desde aquí.`);
      return;
    }

    setStatus("queued");
    setProgress(0);

    // 1) POST para crear el job
    let jobId: string;
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        setStatus("error");
        toast.error(body.message ?? body.error ?? "Error al iniciar descarga");
        return;
      }

      const data = (await res.json()) as { jobId: string };
      jobId = data.jobId;
    } catch (err) {
      setStatus("error");
      toast.error((err as Error).message ?? "Error de red");
      return;
    }

    // 2) Abrir SSE para tracking de progreso
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
        toast.error(job.error ?? "Error al descargar");
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
      toast.error("Conexión perdida con el servidor");
    };
  }

  async function triggerDownload(jobId: string, filename?: string) {
    try {
      const res = await fetch(`/api/download/${jobId}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Error al descargar el archivo");
        setStatus("error");
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename ?? `download.${format === "mp3-320" ? "mp3" : "m4a"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      setStatus("ready");
      toast.success("Descarga lista");
      setTimeout(() => {
        setStatus("idle");
        setProgress(0);
      }, 1500);
    } catch (err) {
      setStatus("error");
      toast.error((err as Error).message ?? "Error al descargar");
    }
  }

  const isBusy = status !== "idle" && status !== "ready" && status !== "error";

  return (
    <Card className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="url" className="text-sm font-medium text-foreground/80">
            Enlace
          </label>
          <Input
            id="url"
            ref={inputRef}
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isBusy}
            autoComplete="off"
            spellCheck={false}
          />
          {platform.name && !isDrm && !platform.usesExternalTool && (
            <span className="text-xs text-foreground/60">
              Plataforma detectada: <strong className="text-foreground/90">{platform.name}</strong>
            </span>
          )}
          {platform.usesExternalTool && (
            <span className="text-xs text-cyan-400">
              {platform.name} — búsqueda en YouTube con metadatos originales.
            </span>
          )}
          {isDrm && (
            <span className="text-xs text-amber-400">
              {platform.name} usa DRM — esta plataforma no se puede descargar.
            </span>
          )}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground/80">
            Formato
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <FormatOption
              active={format === "mp3-320"}
              onClick={() => { setFormat("mp3-320"); onFormatChange?.("mp3-320"); }}
              title="MP3 320 kbps"
              description="Recodifica con ffmpeg. Compatible con todo."
            />
            <FormatOption
              active={format === "best"}
              onClick={() => { setFormat("best"); onFormatChange?.("best"); }}
              title="Mejor disponible"
              description="Opus/M4A nativo, sin recodificar. Menor tamaño."
            />
          </div>
        </fieldset>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isBusy || isDrm}>
            {isBusy ? STATUS_LABELS[status] : "Descargar"}
          </Button>
          {isBusy && (
            <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 rounded-full"
                style={{ width: "0%" }}
              />
            </div>
          )}
          {status === "ready" && (
            <span className="text-sm text-emerald-400">
              ✓ {STATUS_LABELS.ready}
            </span>
          )}
          {status === "error" && (
            <span className="text-sm text-rose-400">
              ✗ Error — revisa el mensaje
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

interface FormatOptionProps {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}

function FormatOption({ active, onClick, title, description }: FormatOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left rounded-xl border p-4 transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400",
        active
          ? "border-fuchsia-400/60 bg-fuchsia-500/10"
          : "border-foreground/10 bg-foreground/5 hover:bg-foreground/10",
      ].join(" ")}
      aria-pressed={active}
    >
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-foreground/60 mt-1 leading-relaxed">
        {description}
      </div>
    </button>
  );
}
