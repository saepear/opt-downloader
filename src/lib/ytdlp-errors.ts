import { YtdlpError } from "./ytdlp";

/**
 * Catálogo cerrado de códigos de error legibles. La UI los mapea 1:1 a
 * mensajes en español; cualquier valor fuera de este set se trata como
 * `UNKNOWN` (fallback en español, nunca un string técnico al usuario).
 *
 * Se mantiene sincronizado con `humanizeYtdlpError` abajo.
 */
export type ErrorCode =
  | "DRM_PROTECTED"
  | "UNAVAILABLE"
  | "PRIVATE"
  | "RATE_LIMITED"
  | "NO_MEDIA"
  | "UNSUPPORTED"
  | "NETWORK"
  | "BINARY_MISSING"
  | "UNKNOWN";

export interface HumanError {
  code: ErrorCode;
  /** Mensaje en español listo para mostrar al usuario. */
  message: string;
  /** Sugerencia opcional (no siempre aplica). */
  hint?: string;
  /** HTTP status sugerido para el route handler. */
  httpStatus: number;
}

const HUMAN_ERRORS: Record<ErrorCode, Omit<HumanError, "code">> = {
  DRM_PROTECTED: {
    message: "Esta plataforma usa DRM y no podemos descargar su contenido.",
    hint: "Prueba con otra fuente (YouTube, SoundCloud, Bandcamp).",
    httpStatus: 422,
  },
  UNAVAILABLE: {
    message: "El video o track no está disponible.",
    hint: "Verifica que el enlace sea público y no haya sido eliminado.",
    httpStatus: 404,
  },
  PRIVATE: {
    message: "El contenido es privado.",
    hint: "Solo se admiten enlaces públicos.",
    httpStatus: 403,
  },
  RATE_LIMITED: {
    message: "La plataforma nos está limitando temporalmente.",
    hint: "Espera un par de minutos y vuelve a intentarlo.",
    httpStatus: 429,
  },
  NO_MEDIA: {
    message: "No se encontró audio en este enlace.",
    hint: "Asegúrate de que la URL apunte a un video o track, no a un canal o página.",
    httpStatus: 404,
  },
  UNSUPPORTED: {
    message: "Esta plataforma o formato no está soportado.",
    httpStatus: 415,
  },
  NETWORK: {
    message: "No pudimos contactar la plataforma.",
    hint: "Revisa tu conexión o intenta más tarde.",
    httpStatus: 502,
  },
  BINARY_MISSING: {
    message: "Falta yt-dlp o ffmpeg en el servidor.",
    hint: "Contacta al administrador (yt-dlp o ffmpeg no encontrados).",
    httpStatus: 500,
  },
  UNKNOWN: {
    message: "Ocurrió un error inesperado al procesar la solicitud.",
    httpStatus: 500,
  },
};

/**
 * Mensaje final para UI. Concatena `message` + `hint` si existe.
 */
export function toUserMessage(h: HumanError): string {
  return h.hint ? `${h.message} ${h.hint}` : h.message;
}

/**
 * Mapea un error crudo (idealmente un `YtdlpError`, pero acepta cualquier
 * `Error` para resilience) a un `HumanError` con código estable.
 *
 * Estrategia: regex contra el stderr + exit code como último recurso. Los
 * patrones se afinaron contra los mensajes reales de yt-dlp 2026.03.17,
 * pero yt-dlp cambia mensajes entre versiones — por eso `UNKNOWN` es el
 * fallback honesto y los códigos son aditivos (nunca rompemos API).
 */
export function humanizeYtdlpError(err: unknown): HumanError {
  // YtdlpError tiene stderr y exitCode. Para errores de spawn (binario
  // no encontrado), el message es suficiente.
  const stderr =
    err instanceof YtdlpError ? err.stderr : err instanceof Error ? err.message : "";
  const exitCode = err instanceof YtdlpError ? err.exitCode : -1;
  const haystack = stderr.toLowerCase();

  // 1) Binario no encontrado (ENOENT etc.) — distinguible porque NO viene
  //    de yt-dlp sino del spawn del propio Node.
  if (
    err instanceof Error &&
    /ENOENT|no such file|cannot find the (file|binary)/i.test(err.message) &&
    !stderr.includes("ERROR:")
  ) {
    return { code: "BINARY_MISSING", ...HUMAN_ERRORS.BINARY_MISSING };
  }

  // 2) DRM (Spotify etc.)
  if (/\[DRM\]|DRM protection|known to use DRM/i.test(haystack)) {
    return { code: "DRM_PROTECTED", ...HUMAN_ERRORS.DRM_PROTECTED };
  }

  // 3) Privado / requiere login
  if (
    /sign in to confirm|not a bot|confirm your age|private video|login required|members only/i.test(
      haystack
    )
  ) {
    return { code: "PRIVATE", ...HUMAN_ERRORS.PRIVATE };
  }

  // 4) Rate limited
  if (/HTTP Error 429|Too Many Requests|rate.?limit/i.test(haystack)) {
    return { code: "RATE_LIMITED", ...HUMAN_ERRORS.RATE_LIMITED };
  }

  // 5) Track / video inexistente
  if (
    /video unavailable|this video is no longer available|track not found|removed by the uploader|404: not found/i.test(
      haystack
    )
  ) {
    return { code: "UNAVAILABLE", ...HUMAN_ERRORS.UNAVAILABLE };
  }

  // 6) Sin medio extraíble
  if (/no video could be found|no media found/i.test(haystack)) {
    return { code: "NO_MEDIA", ...HUMAN_ERRORS.NO_MEDIA };
  }

  // 7) URL no soportada por yt-dlp
  if (/unsupported url|extractor not found/i.test(haystack)) {
    return { code: "UNSUPPORTED", ...HUMAN_ERRORS.UNSUPPORTED };
  }

  // 8) Errores de red (DNS, conexión, timeout). NO usar el exitCode porque
  //    yt-dlp suele devolver 1 también para errores de parseo legítimos.
  if (
    /name or service not known|connection (refused|reset|timed out)|network is unreachable|getaddrinfo/i.test(
      haystack
    )
  ) {
    return { code: "NETWORK", ...HUMAN_ERRORS.NETWORK };
  }

  // 9) Fallback por exitCode: yt-dlp devuelve 101 cuando recibe SIGTERM
  //    o cuando ffmpeg falla con código != 0 en post-procesado.
  void exitCode;
  return { code: "UNKNOWN", ...HUMAN_ERRORS.UNKNOWN };
}