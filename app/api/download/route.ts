import type { NextRequest } from "next/server";
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { detectPlatform } from "@/lib/platforms";
import { publishUpdate } from "@/lib/progress-bus";
import { checkDownloadLimit } from "@/lib/download-limit";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import type { ApiError, AudioFormat } from "@/lib/types";
import {
  YtdlpError,
  cleanupJobDir,
  downloadAudio,
} from "@/lib/ytdlp";
import {
  humanizeYtdlpError,
  toUserMessage,
} from "@/lib/ytdlp-errors";
import { SpotDlError, downloadSpotify } from "@/lib/spotdl";

const Body = z.object({
  url: z.string().url().refine((u) => /^https?:\/\//.test(u), {
    message: "Solo se aceptan URLs http(s)",
  }),
  format: z.enum(["mp3-320", "best", "wav", "flac"]),
});

export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(req: NextRequest): Promise<Response> {
  // 1) Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Necesitas iniciar sesión para descargar",
      } satisfies ApiError,
      { status: 401 }
    );
  }
  const userId = session.user.id;

  // 1.5) Daily download limit
  const ip = clientIpFromHeaders(
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip") ?? "unknown"
  );
  const limitCheck = await checkDownloadLimit(ip, userId);
  if (!limitCheck.ok) {
    return Response.json(
      {
        error: "download_limit",
        message: "Has alcanzado el límite de 10 descargas por día. Vuelve mañana.",
        details: { remaining: 0, limit: 10 },
      } satisfies ApiError,
      { status: 429 }
    );
  }

  // 2) Body
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
      {
        error: "invalid_body",
        message: "Datos de entrada inválidos",
        details: parsed.error.flatten(),
      } satisfies ApiError,
      { status: 400 }
    );
  }

  const { url, format } = parsed.data;
  const platform = detectPlatform(url);
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const jobDir = join(env.DOWNLOAD_DIR, jobId);

  // 3) Crear job en el bus de progreso
  publishUpdate({
    id: jobId,
    url,
    format,
    status: "queued",
    progress: 0,
  });

  // 4) Lanzar descarga asíncrona en background
  runDownloadJob(jobId, url, format, jobDir, userId, platform.id);

  logger.info({ url, format, platform: platform.id, userId, jobId }, "download_queued");

  return Response.json({ jobId }, { status: 202 });
}

// ---------------------------------------------------------------------------
// Background job
// ---------------------------------------------------------------------------

async function runDownloadJob(
  jobId: string,
  url: string,
  format: AudioFormat,
  jobDir: string,
  userId: string,
  platformId: string
): Promise<void> {
  try {
    await mkdir(env.DOWNLOAD_DIR, { recursive: true });
    await mkdir(jobDir, { recursive: true });

    publishUpdate({ id: jobId, url, format, status: "fetching", progress: 0 });

    if (platformId === "spotify") {
      await runSpotifyDownload(jobId, url, format, jobDir, userId);
    } else {
      await runYtdlpDownload(jobId, url, format, jobDir, userId, platformId);
    }
  } catch (err) {
    const stderr =
      err instanceof YtdlpError ? err.stderr.slice(0, 500)
      : err instanceof SpotDlError ? err.stderr.slice(0, 500)
      : "";
    const human = humanizeYtdlpError(err);

    logger.error(
      { err: (err as Error).message, url, format, platform: platformId, userId, code: human.code, stderr },
      "download_failed"
    );

    await cleanupJobDir(jobDir);

    publishUpdate({
      id: jobId, url, format, status: "error", progress: 0, error: toUserMessage(human),
    });

    try {
      await prisma.download.create({
        data: {
          userId, url, platform: platformId, format,
          title: safeTitleFromUrl(url), status: "failed", errorCode: human.code,
        },
      });
    } catch (dbErr) {
      logger.error({ err: (dbErr as Error).message, userId, url }, "download_persist_failed");
    }
  }
}

async function runYtdlpDownload(
  jobId: string, url: string, format: AudioFormat, jobDir: string,
  userId: string, platformId: string
): Promise<void> {
  const result = await downloadAudio(url, format, jobDir, (pct) => {
    publishUpdate({
      id: jobId, url, format,
      status: pct < 100 ? "downloading" : "converting",
      progress: Math.round(pct),
    });
  });

  const stats = await stat(result.filepath);
  const ext = result.filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = ext === "mp3" ? "audio/mpeg"
    : ext === "m4a" ? "audio/mp4"
    : ext === "webm" ? "audio/webm"
    : ext === "opus" ? "audio/ogg"
    : "application/octet-stream";

  publishUpdate({
    id: jobId, url, format, status: "ready", progress: 100,
    filename: result.filename, filepath: result.filepath, contentType,
  });

  logger.info(
    { jobDir, filepath: result.filepath, bytes: stats.size, format, platform: platformId, userId },
    "download_completed"
  );

  try {
    await prisma.download.create({
      data: {
        userId, url, platform: platformId, format,
        title: result.meta.title, artist: result.meta.uploader,
        status: "completed", filePath: result.filepath, bytes: stats.size,
      },
    });
  } catch (dbErr) {
    logger.error({ err: (dbErr as Error).message, userId, url }, "download_persist_failed");
  }
}

async function runSpotifyDownload(
  jobId: string, url: string, format: AudioFormat, jobDir: string,
  userId: string
): Promise<void> {
  // spotDL busca en YouTube y descarga con metadatos de Spotify
  publishUpdate({ id: jobId, url, format, status: "downloading", progress: 10 });

  const results = await downloadSpotify(url, jobDir);

  if (results.length === 0) {
    throw new YtdlpError("spotDL no devolvió archivos", -1, "");
  }

  // Para un track individual, usar el primer resultado
  const first = results[0];
  const stats = await stat(first.filepath);

  publishUpdate({
    id: jobId, url, format, status: "ready", progress: 100,
    filename: first.filename, filepath: first.filepath,
    contentType: "audio/mpeg",
  });

  logger.info(
    { jobDir, filepath: first.filepath, bytes: stats.size, platform: "spotify", userId },
    "spotify_download_completed"
  );

  try {
    await prisma.download.create({
      data: {
        userId, url, platform: "spotify", format,
        title: first.title, artist: first.artist,
        status: "completed", filePath: first.filepath, bytes: stats.size,
      },
    });
  } catch (dbErr) {
    logger.error({ err: (dbErr as Error).message, userId, url }, "download_persist_failed");
  }
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
