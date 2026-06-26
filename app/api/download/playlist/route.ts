import type { NextRequest } from "next/server";
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { createWriteStream } from "node:fs";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { ZipArchive } from "archiver";
function createArchiver(options?: { zlib?: { level: number } }): ZipArchive {
  return new ZipArchive(options);
}
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { detectPlatform } from "@/lib/platforms";
import { publishUpdate } from "@/lib/progress-bus";
import type { ApiError, AudioFormat } from "@/lib/types";
import {
  cleanupJobDir,
  downloadAudio,
  fetchPlaylistEntries,
  detectContentType,
  YtdlpError,
} from "@/lib/ytdlp";
import {
  humanizeYtdlpError,
  toUserMessage,
} from "@/lib/ytdlp-errors";
import { checkDownloadLimit } from "@/lib/download-limit";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import { SpotDlError, downloadSpotify } from "@/lib/spotdl";

const Body = z.object({
  url: z.string().url().refine((u) => /^https?:\/\//.test(u), {
    message: "Solo se aceptan URLs http(s)",
  }),
  format: z.enum(["mp3-320", "best", "wav", "flac"]),
  selectedIds: z.array(z.number().or(z.string())).optional(),
});

export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(req: NextRequest): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(
      { error: "unauthorized", message: "Necesitas iniciar sesión" } satisfies ApiError,
      { status: 401 }
    );
  }
  const userId = session.user.id;

  // Daily download limit
  const ip = clientIpFromHeaders(
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip") ?? "unknown"
  );
  const limitCheck = await checkDownloadLimit(ip, userId);
  if (!limitCheck.ok) {
    return Response.json(
      {
        error: "download_limit",
        message: "Has alcanzado el límite de descargas por hoy.",
        details: { remaining: 0, limit: limitCheck.remaining },
      } satisfies ApiError,
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json(
      { error: "invalid_json", message: "Body no es JSON válido" } satisfies ApiError,
      { status: 400 }
    );
  }

  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_body", message: "Datos inválidos", details: parsed.error.flatten() } satisfies ApiError,
      { status: 400 }
    );
  }

  const { url, format, selectedIds } = parsed.data;
  const platform = detectPlatform(url);
  const jobId = `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const jobDir = join(env.DOWNLOAD_DIR, jobId);

  const isSpotify = platform.id === "spotify";
  const filterSet = selectedIds && selectedIds.length > 0
    ? new Set(selectedIds.map(String))
    : null;

  // 1) Para Spotify, detectamos vía plataforma (yt-dlp no soporta Spotify)
  //    Para el resto, usar yt-dlp para obtener entries
  let preloadedEntries: { title: string; url: string }[] | null = null;

  if (!isSpotify) {
    try {
      const media = await detectContentType(url);
      if (media.type !== "playlist") {
        return Response.json(
          { error: "not_a_playlist", message: "La URL no es una playlist" } satisfies ApiError,
          { status: 400 }
        );
      }
      preloadedEntries = await fetchPlaylistEntries(url);
    } catch (err) {
      const human = humanizeYtdlpError(err);
      return Response.json(
        { error: "playlist_fetch_failed", message: toUserMessage(human), code: human.code } satisfies ApiError,
        { status: human.httpStatus }
      );
    }
  }

  if (preloadedEntries && preloadedEntries.length === 0) {
    return Response.json(
      { error: "empty_playlist", message: "No se encontraron tracks" } satisfies ApiError,
      { status: 404 }
    );
  }

  logger.info({ url, format, platform: platform.id, userId, jobId }, "playlist_queued");

  publishUpdate({
    id: jobId, url, format, status: "queued", progress: 0,
    filename: `${makeSafeName(platform.id)}-playlist.zip`,
  });

  runPlaylistJob(jobId, url, format, jobDir, userId, platform.id, isSpotify, preloadedEntries, filterSet);

  return Response.json({ jobId, total: preloadedEntries?.length ?? 0 }, { status: 202 });
}

// ---------------------------------------------------------------------------
// Background job
// ---------------------------------------------------------------------------

async function runPlaylistJob(
  jobId: string, url: string, format: AudioFormat, jobDir: string,
  userId: string, platformId: string, isSpotify: boolean,
  preloadedEntries: { title: string; url: string }[] | null,
  filterSet: Set<string> | null
): Promise<void> {
  try {
    await mkdir(env.DOWNLOAD_DIR, { recursive: true });
    await mkdir(jobDir, { recursive: true });

    const trackDir = join(jobDir, "tracks");
    await mkdir(trackDir, { recursive: true });

    if (isSpotify) {
      await runSpotifyPlaylist(jobId, url, trackDir);
    } else {
      await runYtdlpPlaylist(jobId, url, format, trackDir, preloadedEntries!, filterSet);
    }

    // Crear ZIP
    publishUpdate({ id: jobId, url, format, status: "converting", progress: 90, filename: "playlist.zip" });

    const zipPath = join(jobDir, "playlist.zip");
    await createZip(trackDir, zipPath);

    const stats = await stat(zipPath);

    publishUpdate({
      id: jobId, url, format, status: "ready", progress: 100,
      filename: "playlist.zip", filepath: zipPath, contentType: "application/zip",
    });

    logger.info({ jobId, bytes: stats.size }, "playlist_completed");

    try {
      await prisma.download.create({
        data: {
          userId, url, platform: platformId, format,
          title: `Playlist (${platformId})`,
          status: "completed", filePath: zipPath, bytes: stats.size,
        },
      });
    } catch (dbErr) {
      logger.error({ err: (dbErr as Error).message, userId }, "playlist_persist_failed");
    }
  } catch (err) {
    const stderr =
      err instanceof YtdlpError ? err.stderr.slice(0, 500)
      : err instanceof SpotDlError ? err.stderr.slice(0, 500)
      : "";
    const human = humanizeYtdlpError(err);

    logger.error({ err: (err as Error).message, jobId, code: human.code, stderr }, "playlist_failed");
    await cleanupJobDir(jobDir);

    publishUpdate({ id: jobId, url, format, status: "error", progress: 0, error: toUserMessage(human) });

    try {
      await prisma.download.create({
        data: {
          userId, url, platform: platformId, format,
          title: safeTitleFromUrl(url), status: "failed", errorCode: human.code,
        },
      });
    } catch (dbErr) {
      logger.error({ err: (dbErr as Error).message, userId }, "playlist_persist_failed");
    }
  }
}

async function runYtdlpPlaylist(
  jobId: string, url: string, format: AudioFormat,
  trackDir: string, entries: { title: string; url: string }[],
  filterSet: Set<string> | null
): Promise<void> {
  const filtered = filterSet
    ? entries.filter((_, i) => filterSet.has(String(i)))
    : entries;
  const total = filtered.length;

  for (let i = 0; i < total; i++) {
    const entry = filtered[i];

    publishUpdate({
      id: jobId, url, format, status: "downloading",
      progress: Math.round((i / total) * 100),
      filename: `${makeSafeName(entry.title)}.${format === "mp3-320" ? "mp3" : "m4a"}`,
    });

    try {
      await downloadAudio(entry.url, format, trackDir);
    } catch (err) {
      logger.warn({ jobId, track: i + 1, title: entry.title, err: (err as Error).message }, "playlist_track_skipped");
    }
  }
}

async function runSpotifyPlaylist(
  jobId: string, url: string, trackDir: string
): Promise<void> {
  publishUpdate({ id: jobId, url, format: "mp3-320", status: "downloading", progress: 5 });

  const results = await downloadSpotify(url, trackDir);

  for (let i = 0; i < results.length; i++) {
    publishUpdate({
      id: jobId, url, format: "mp3-320", status: "downloading",
      progress: Math.round(((i + 1) / results.length) * 85),
      filename: results[i].filename,
    });
  }

  logger.info({ jobId, trackCount: results.length }, "spotify_playlist_downloaded");
}

async function createZip(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = createArchiver({ zlib: { level: 6 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function makeSafeName(s: string): string {
  return s.replace(/[^\w\- ]+/g, "_").trim() || "audio";
}

function safeTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const lastSegment = u.pathname.split("/").filter(Boolean).pop();
    return lastSegment ?? u.hostname;
  } catch {
    return url.slice(0, 80);
  }
}
