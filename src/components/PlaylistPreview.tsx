"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AudioFormat, DownloadStatus } from "@/lib/types";
import toast from "react-hot-toast";

interface PlaylistEntry {
  title: string;
  url: string;
  duration: number | null;
  uploader: string | null;
}

interface PlaylistData {
  playlistTitle: string;
  playlistCount: number;
  entries: PlaylistEntry[];
}

interface PlaylistPreviewProps {
  url: string;
  format: AudioFormat;
}

type PStatus = "idle" | "detecting" | DownloadStatus | "done";

const STATUS_TEXTS: Record<string, string> = {
  idle: "",
  detecting: "Detectando playlist…",
  queued: "En cola…",
  downloading: "Descargando tracks…",
  converting: "Creando ZIP…",
  ready: "Descarga lista",
  error: "Error",
  done: "",
};

export function PlaylistPreview({ url, format }: PlaylistPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PlaylistData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dlStatus, setDlStatus] = useState<PStatus>("idle");
  const [dlProgress, setDlProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => sseRef.current?.close();
  }, []);

  const looksLikePlaylist = /list=|playlist|album|set\//i.test(url);

  // Debounced playlist detection — solo inicia si la URL parece playlist
  useEffect(() => {
    if (!url.trim() || !looksLikePlaylist) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setDlStatus("idle");
      try {
        const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
          setError((await res.json().catch(() => ({}))).message ?? null);
          setData(null);
          return;
        }
        const json = await res.json();
        if (json.type === "playlist") {
          const entries: PlaylistEntry[] = json.entries ?? [];
          setData({
            playlistTitle: json.playlistTitle,
            playlistCount: json.playlistCount,
            entries,
          });
          setSelected(new Set(entries.map((_, i) => i)));
        } else {
          setData(null);
        }
      } catch {
        setError("Error de red");
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [url, looksLikePlaylist]);

  function toggleTrack(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function selectAll() {
    if (!data) return;
    setSelected(new Set(data.entries.map((_, i) => i)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  const downloadZip = useCallback(async (jobId: string, filename?: string) => {
    try {
      const res = await fetch(`/api/download/${jobId}`);
      if (!res.ok) {
        toast.error("Error al descargar el ZIP");
        setDlStatus("error");
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename ?? "playlist.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      toast.success("Playlist lista");
      setTimeout(() => setDlStatus("done"), 200);
    } catch {
      setDlStatus("error");
      toast.error("Error al descargar el ZIP");
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!data || selected.size === 0) {
      toast.error("Selecciona al menos un track");
      return;
    }

    setDlStatus("queued");
    setDlProgress(0);

    let jobId: string;
    try {
      const res = await fetch("/api/download/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          format,
          selectedIds: Array.from(selected),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setDlStatus("error");
        toast.error(body.message ?? "Error al iniciar descarga");
        return;
      }

      const body = (await res.json()) as { jobId: string; total: number };
      jobId = body.jobId;
    } catch (err) {
      setDlStatus("error");
      toast.error((err as Error).message ?? "Error de red");
      return;
    }

    // 2) SSE tracking
    const sse = new EventSource(`/api/progress/${jobId}`);
    sseRef.current = sse;

    sse.onmessage = (event) => {
      let job: { status: DownloadStatus | "removed"; progress: number; error?: string; filename?: string; filepath?: string; contentType?: string };
      try {
        job = JSON.parse(event.data);
      } catch {
        return;
      }

      setDlStatus(job.status === "removed" ? "error" : job.status);
      setDlProgress(job.progress ?? 0);

      if (job.status === "error") {
        sse.close();
        sseRef.current = null;
        toast.error(job.error ?? "Error al descargar playlist");
      }

      if (job.status === "ready") {
        sse.close();
        sseRef.current = null;
        setDlProgress(100);
        downloadZip(jobId, job.filename);
      }
    };

    sse.onerror = () => {
      sse.close();
      sseRef.current = null;
      setDlStatus("error");
      toast.error("Conexión perdida");
    };
  }, [data, selected, url, format, downloadZip]);

  // No mostrar si la URL no parece playlist o no hay data
  if (!looksLikePlaylist || !data || error) return null;

  const isActive = dlStatus !== "idle" && dlStatus !== "done" && dlStatus !== "error";
  const entries = data.entries.slice(0, 50);

  return (
    <Card className="w-full max-w-2xl border-amber-400/30 bg-amber-500/5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-amber-300 truncate">
            Playlist detectada
          </h3>
          <p className="text-xs text-foreground/60 mt-0.5 truncate">
            {data.playlistTitle}
          </p>
          <p className="text-xs text-foreground/50 mt-0.5">
            {data.playlistCount} tracks · mostrando primeras {entries.length}
          </p>
        </div>
        {!isActive && (
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80"
            >
              Todo
            </button>
            <span className="text-[11px] text-foreground/30">·</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-[11px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80"
            >
              Ninguno
            </button>
          </div>
        )}
      </div>

      {!isActive && (
        <div className="max-h-48 overflow-y-auto flex flex-col gap-1 mb-3 pr-1">
          {entries.map((entry, i) => (
            <label
              key={i}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggleTrack(i)}
                className="accent-fuchsia-400 size-3.5 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs truncate">{entry.title}</div>
                {entry.uploader && (
                  <div className="text-[10px] text-foreground/50 truncate">{entry.uploader}</div>
                )}
              </div>
              {entry.duration !== null && (
                <span className="text-[10px] text-foreground/40 shrink-0">
                  {fmtDuration(entry.duration)}
                </span>
              )}
            </label>
          ))}
        </div>
      )}

      {isActive && (
        <div className="mb-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-foreground/70">{STATUS_TEXTS[dlStatus] ?? dlStatus}</span>
            <span className="text-xs text-foreground/40">{dlProgress}%</span>
          </div>
          <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-fuchsia-400 rounded-full transition-all duration-400"
              style={{ width: `${dlProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {!isActive && dlStatus !== "done" && (
          <Button
            type="button"
            onClick={handleDownload}
            disabled={selected.size === 0}
          >
            Descargar ZIP ({selected.size} tracks)
          </Button>
        )}
        {dlStatus === "done" && (
          <span className="text-sm text-emerald-400">✓ Playlist lista</span>
        )}
        {dlStatus === "error" && (
          <span className="text-sm text-rose-400">✗ Error</span>
        )}
        {loading && (
          <span className="text-xs text-foreground/50">Detectando…</span>
        )}
      </div>
    </Card>
  );
}

function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
