/**
 * Tipos compartidos por el cliente, los Route Handlers y la capa de yt-dlp.
 * Si Fase 2 introduce Spotify/SoundCloud, este archivo es donde se añaden
 * los códigos de error y los formatos adicionales.
 */

/** Formato de audio solicitado por el usuario. */
export type AudioFormat = "mp3-320" | "best";

/** Cuerpo del POST /api/download. Validado con Zod en el route handler. */
export interface DownloadRequest {
  url: string;
  format: AudioFormat;
}

/**
 * Estado de un job de descarga. En Fase 1 el ciclo de vida es corto y vive
 * dentro de la misma petición HTTP, pero el modelo queda preparado para
 * Fase 4 (SSE) donde el cliente recibe `DownloadJob` actualizados.
 */
export type DownloadStatus =
  | "queued"
  | "fetching"
  | "downloading"
  | "converting"
  | "ready"
  | "error"
  | "removed";

export interface DownloadJob {
  id: string;
  url: string;
  format: AudioFormat;
  status: DownloadStatus | "removed";
  /** 0-100. Solo aplica a `downloading` y `converting`. */
  progress: number;
  /** Mensaje legible cuando `status === "error"`. */
  error?: string;
  filename?: string;
  filepath?: string;
  contentType?: string;
}

/**
 * Envelope de error que todos los route handlers devuelven en caso de fallo.
 * Mantener la forma estable ayuda al frontend a mapear errores sin parsear
 * strings (Fase 2 introducirá `humanizeYtdlpError`).
 */
export interface ApiError {
  error: string;
  code?: string;
  message?: string;
  details?: unknown;
}