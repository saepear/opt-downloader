import { spawn } from "node:child_process";
import { env } from "./env";

/**
 * Wrapper sobre `yt-dlp ytsearch3:QUERY` para búsqueda por nombre.
 * Devuelve hasta N resultados con metadatos mínimos para mostrar cards
 * en la UI.
 */

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  durationSec: number | null;
  uploader: string | null;
  thumbnail: string | null;
}

/**
 * Parsea UNA línea JSON de yt-dlp (cuando usa `--dump-json` con
 * `--flat-playlist`, cada resultado se imprime en su propia línea).
 */
function parseLine(line: string): SearchResult | null {
  try {
    const j = JSON.parse(line);
    if (!j.id || !j.title || !j.url) return null;
    return {
      id: String(j.id),
      title: String(j.title),
      url: String(j.url),
      durationSec: typeof j.duration === "number" ? j.duration : null,
      uploader: typeof j.uploader === "string" ? j.uploader : null,
      // `thumbnails` es array; cogemos el primero o el de mayor resolución.
      thumbnail:
        Array.isArray(j.thumbnails) && j.thumbnails.length > 0
          ? String(j.thumbnails[j.thumbnails.length - 1].url ?? j.thumbnails[0].url ?? "")
          : typeof j.thumbnail === "string"
          ? j.thumbnail
          : null,
    };
  } catch {
    return null;
  }
}

/**
 * `yt-dlp --flat-playlist --dump-json` con `ytsearch3:QUERY` emite hasta
 * 3 líneas JSON, una por resultado. Esta función las junta.
 */
export function searchTracks(
  query: string,
  limit: number = 3
): Promise<SearchResult[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      env.YT_DLP_BIN,
      [
        `--flat-playlist`,
        `--dump-json`,
        `--no-warnings`,
        `--no-playlist`,
        `ytsearch${limit}:${query}`,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("error", (err) =>
      reject(new Error(`No se pudo invocar yt-dlp: ${err.message}`))
    );
    proc.on("close", (code) => {
      if (code !== 0) {
        // Errores de yt-dlp en stderr son legibles — los dejamos al caller
        // para que mapee con humanizeYtdlpError.
        const err = new Error(stderr || `yt-dlp exit ${code}`);
        (err as Error & { exitCode: number }).exitCode = code ?? -1;
        reject(err);
      }
      const results: SearchResult[] = [];
      for (const line of stdout.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const r = parseLine(trimmed);
        if (r) results.push(r);
      }
      resolve(results);
    });
  });
}

/**
 * Convierte `seconds` (puede ser null) a `m:ss` o `h:mm:ss`.
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}