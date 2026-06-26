import { spawn } from "node:child_process";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { env } from "./env";
import { logger } from "./logger";
import type { AudioFormat } from "./types";

/**
 * Wrapper sobre el binario `yt-dlp` del sistema. Toda la comunicación se
 * hace vía `spawn` con argumentos como array — NUNCA `shell: true` con
 * strings concatenados (defensa contra el security scan del runtime y
 * contra command injection).
 */

export class YtdlpError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number,
    public readonly stderr: string
  ) {
    super(message);
    this.name = "YtdlpError";
  }
}

export interface VideoMetadata {
  title: string;
  /** Duración en segundos. `null` cuando yt-dlp no la conoce (streams en vivo). */
  duration: number | null;
  /** Nombre del canal / artista cuando yt-dlp lo expone. */
  uploader: string | null;
}

export interface PlaylistEntry {
  title: string;
  url: string;
  duration: number | null;
  uploader: string | null;
}

export interface PlaylistInfo {
  playlistTitle: string;
  playlistCount: number;
  entries: PlaylistEntry[];
}

export type MediaInfo =
  | { type: "video"; metadata: VideoMetadata }
  | { type: "playlist"; info: PlaylistInfo };

export interface DownloadResult {
  /** Ruta absoluta al archivo final en disco. */
  filepath: string;
  /** Nombre del archivo (basename), listo para `Content-Disposition`. */
  filename: string;
  /** Metadatos útiles para logs / persistencia futura. */
  meta: VideoMetadata;
}

/**
 * Invoca `yt-dlp --dump-json` y devuelve los metadatos mínimos del video.
 * Se usa antes de la descarga real para conocer el título y poder nombrar
 * el archivo de salida de forma legible.
 */
export function fetchMetadata(url: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      env.YT_DLP_BIN,
      ["--dump-json", "--no-download", "--no-warnings", "--no-playlist", url],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(
        new YtdlpError(
          `No se pudo invocar yt-dlp: ${err.message}`,
          -1,
          stderr
        )
      );
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        logger.warn({ url, code, stderr }, "ytdlp_metadata_failed");
        return reject(new YtdlpError("yt-dlp no devolvió metadatos", code ?? -1, stderr));
      }
      try {
        const json = JSON.parse(stdout);
        resolve({
          title: String(json.title ?? "audio"),
          duration: typeof json.duration === "number" ? json.duration : null,
          uploader: typeof json.uploader === "string" ? json.uploader : null,
        });
      } catch (err) {
        reject(
          new YtdlpError(
            `JSON inválido de yt-dlp: ${(err as Error).message}`,
            code ?? -1,
            stderr
          )
        );
      }
    });
  });
}

/**
 * Detecta si la URL es una playlist/álbum y devuelve el tipo de contenido.
 * NO descarga nada — solo parsea la primera línea JSON de yt-dlp.
 * Sin `--no-playlist` para que yt-dlp reporte playlist_count si aplica.
 */
export function detectContentType(url: string): Promise<MediaInfo> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      env.YT_DLP_BIN,
      ["--dump-json", "--no-download", "--no-warnings", url],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(new YtdlpError(`No se pudo invocar yt-dlp: ${err.message}`, -1, stderr));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new YtdlpError("yt-dlp no devolvió metadatos", code ?? -1, stderr));
      }
      try {
        const firstLine = stdout.split("\n")[0];
        const json = JSON.parse(firstLine);
        const count = typeof json.playlist_count === "number" ? json.playlist_count : 0;

        if (count > 1) {
          resolve({
            type: "playlist",
            info: {
              playlistTitle: String(json.playlist_title ?? json.title ?? "Playlist"),
              playlistCount: count,
              entries: [],
            },
          });
        } else {
          resolve({
            type: "video",
            metadata: {
              title: String(json.title ?? "audio"),
              duration: typeof json.duration === "number" ? json.duration : null,
              uploader: typeof json.uploader === "string" ? json.uploader : null,
            },
          });
        }
      } catch (err) {
        reject(new YtdlpError(`JSON inválido de yt-dlp: ${(err as Error).message}`, code ?? -1, stderr));
      }
    });
  });
}

/**
 * Para una URL de playlist, devuelve todos los entries usando
 * `--flat-playlist --dump-json`. Una línea JSON por entry.
 */
export function fetchPlaylistEntries(url: string): Promise<PlaylistEntry[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      env.YT_DLP_BIN,
      ["--flat-playlist", "--dump-json", "--no-warnings", url],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(new YtdlpError(`No se pudo invocar yt-dlp: ${err.message}`, -1, stderr));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new YtdlpError("yt-dlp no devolvió entries", code ?? -1, stderr));
      }
      const entries: PlaylistEntry[] = [];
      for (const line of stdout.trim().split("\n")) {
        if (!line) continue;
        try {
          const j = JSON.parse(line);
          if (!j.id || !j.title) continue;
          entries.push({
            title: String(j.title),
            url: String(j.url ?? j.webpage_url ?? `https://www.youtube.com/watch?v=${j.id}`),
            duration: typeof j.duration === "number" ? j.duration : null,
            uploader: typeof j.uploader === "string" ? j.uploader : null,
          });
        } catch {
          // skip malformed lines
        }
      }
      resolve(entries);
    });
  });
}

/**
 * Descarga el audio de `url` en el formato solicitado y lo deja en
 * `outDir/<title>.<ext>`. Llama `onProgress(0..100)` mientras yt-dlp emite
 * la línea `PROGRESS <pct>` por stdout (gracias al template `--progress-template`).
 *
 * Devuelve la ruta absoluta del archivo final + un filename sanitizado.
 */
export function downloadAudio(
  url: string,
  format: AudioFormat,
  outDir: string,
  onProgress?: (percent: number) => void
): Promise<DownloadResult> {
  return new Promise(async (resolve, reject) => {
    try {
      await mkdir(outDir, { recursive: true });
      const meta = await fetchMetadata(url);

      const outTemplate = join(outDir, "%(title)s.%(ext)s");
      const baseArgs = [
        "--no-playlist",
        "--no-warnings",
        "--newline",
        "-o",
        outTemplate,
      ];

      const FORMAT_MAP: Record<string, string[]> = {
        "mp3-320": ["-x", "--audio-format", "mp3", "--audio-quality", "320K"],
        best: ["-f", "bestaudio/best", "--extract-audio", "--audio-format", "best"],
        wav: ["-x", "--audio-format", "wav"],
        flac: ["-x", "--audio-format", "flac"],
      };
      const formatArgs = FORMAT_MAP[format] ?? FORMAT_MAP.best;

      const args = [
        ...baseArgs,
        ...formatArgs,
        ...(onProgress
          ? ["--progress-template", "download:PROGRESS %(percent)s"]
          : []),
        url,
      ];

      const proc = spawn(env.YT_DLP_BIN, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stderr = "";
      proc.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      proc.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        if (!onProgress) return;
        const match = text.match(/PROGRESS\s+(\d+(?:\.\d+)?)/);
        if (match) {
          const pct = parseFloat(match[1]);
          if (!Number.isNaN(pct)) onProgress(pct);
        }
      });

      proc.on("error", (err) => {
        reject(
          new YtdlpError(
            `No se pudo invocar yt-dlp: ${err.message}`,
            -1,
            stderr
          )
        );
      });

      proc.on("close", async (code) => {
        if (code !== 0) {
          logger.warn({ url, format, code, stderr }, "ytdlp_download_failed");
          return reject(
            new YtdlpError("yt-dlp terminó con error", code ?? -1, stderr)
          );
        }
        try {
          const filepath = await findNewestFile(outDir);
          if (!filepath) {
            return reject(
              new YtdlpError(
                "yt-dlp terminó OK pero no se encontró el archivo de salida",
                code ?? -1,
                stderr
              )
            );
          }
          const filename = filepath.split("/").pop() ?? "audio";
          resolve({ filepath, filename, meta });
        } catch (err) {
          reject(err as Error);
        }
      });
    } catch (err) {
      reject(err as Error);
    }
  });
}

/**
 * Devuelve el archivo más reciente en `dir` basándose en mtime. Es la forma
 * más simple de localizar la salida de yt-dlp sin tener que parsear el
 * stdout de progreso para conocer el nombre final.
 *
 * Solo considera archivos regulares (ignora directorios y `.json` parciales).
 */
async function findNewestFile(dir: string): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true });
  let newest: { path: string; mtime: number } | null = null;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.endsWith(".json") || entry.name.endsWith(".part")) continue;
    const fullPath = join(dir, entry.name);
    const stats = await stat(fullPath);
    if (!newest || stats.mtimeMs > newest.mtime) {
      newest = { path: fullPath, mtime: stats.mtimeMs };
    }
  }
  return newest?.path ?? null;
}

/**
 * Borra los archivos parciales `.part` que yt-dlp deja si el proceso muere
 * a mitad de descarga. Llamar después de un fallo reduce ruido en /tmp.
 */
export async function cleanupJobDir(dir: string): Promise<void> {
  try {
    const entries = await readdir(dir);
    await Promise.all(
      entries
        .filter((n) => n.endsWith(".part") || n.endsWith(".ytdl"))
        .map((n) => unlink(join(dir, n)).catch(() => undefined))
    );
  } catch {
    // best-effort, ignorar errores
  }
}