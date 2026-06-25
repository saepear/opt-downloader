import { spawn } from "node:child_process";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { env } from "./env";
import { logger } from "./logger";

export class SpotDlError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number,
    public readonly stderr: string
  ) {
    super(message);
    this.name = "SpotDlError";
  }
}

export interface SpotifyDownloadResult {
  filepath: string;
  filename: string;
  title: string;
  artist: string | null;
}

/**
 * Descarga un track o playlist de Spotify usando spotDL.
 *
 * spotDL busca el audio equivalente en YouTube y lo descarga con metadatos
 * (artista, título, carátula). Para playlists, descarga todos los tracks.
 *
 * Devuelve los paths absolutos de todos los archivos descargados.
 */
export function downloadSpotify(
  url: string,
  outDir: string,
  onProgress?: (current: number, total: number) => void
): Promise<SpotifyDownloadResult[]> {
  return new Promise(async (resolve, reject) => {
    try {
      await mkdir(outDir, { recursive: true });
    } catch {
      // continue
    }

    // spotDL output format: "Artist - Title.mp3"
    const outputTemplate = join(outDir, "{artist} - {title}.{output-ext}");

    const args = [
      url,
      "--format", "mp3",
      "--bitrate", "320k",
      "--output", outputTemplate,
      "--print-errors",
      "--log-level", "INFO",
    ];

    const proc = spawn(env.SPOTDL_BIN, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    // spotDL emite líneas como:
    // "Processing query: URL"
    // "Searching for: Song Name"
    // "Downloading: Song Name"
    // "Skipping Song Name (file already exists)"
    // Podemos contar líneas "Downloading" y "Skipping" como progreso
    let downloaded = 0;
    const total = 0;
    proc.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      const lines = text.trim().split("\n");
      for (const line of lines) {
        const dlMatch = line.match(/^(?:Downloading|Skipping)\s+.+/);
        if (dlMatch) {
          downloaded++;
          onProgress?.(downloaded, total || downloaded);
        }
      }
    });

    proc.on("error", (err) => {
      reject(
        new SpotDlError(
          `No se pudo invocar spotDL: ${err.message}`,
          -1,
          stderr
        )
      );
    });

    proc.on("close", async (code) => {
      if (code !== 0) {
        logger.warn({ url, code, stderr }, "spotdl_failed");
        return reject(
          new SpotDlError("spotDL terminó con error", code ?? -1, stderr)
        );
      }

      try {
        const files = await findMp3Files(outDir);
        if (files.length === 0) {
          return reject(
            new SpotDlError(
              "spotDL terminó OK pero no se encontraron archivos MP3",
              code ?? -1,
              stderr
            )
          );
        }
        const results: SpotifyDownloadResult[] = files.map((f) => ({
          filepath: join(outDir, f),
          filename: f,
          title: f.replace(/\.mp3$/, "").split(" - ").slice(1).join(" - ") || f,
          artist: f.includes(" - ") ? f.split(" - ")[0] : null,
        }));
        resolve(results);
      } catch (err) {
        reject(err as Error);
      }
    });
  });
}

async function findMp3Files(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries
    .filter((name) => name.endsWith(".mp3"))
    .filter((name) => !name.startsWith("."))
    .sort();
}
