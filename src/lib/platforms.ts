/**
 * Catálogo de plataformas que yt-dlp puede extraer. El `id` interno es lo
 * que guardamos en logs/DB (Fase 3); `name` es lo que ve el usuario;
 * `pattern` es regex contra la URL.
 *
 * yt-dlp soporta cientos de sitios; este mapa solo declara los más comunes.
 * Si yt-dlp logra extraer una URL cuyo dominio no está aquí, devolvemos
 * `unknown` pero seguimos adelante (no bloqueamos).
 */

export interface PlatformInfo {
  /** slug estable, kebab-case. Usado en DB y logs. */
  id: PlatformId;
  /** Nombre legible para UI. */
  name: string;
  /** Regex contra la URL completa. */
  pattern: RegExp;
  /** Host canónico para mostrar en la UI cuando hace falta. */
  host: string;
  /** true si la plataforma requiere DRM auth que yt-dlp no puede saltar. */
  hasDrm?: boolean;
  /** true si la plataforma necesita una herramienta externa (spotDL, etc.). */
  usesExternalTool?: boolean;
}

export type PlatformId =
  | "youtube"
  | "spotify"
  | "soundcloud"
  | "bandcamp"
  | "vimeo"
  | "twitter"
  | "tiktok"
  | "generic"
  | "unknown";

export const PLATFORMS: readonly PlatformInfo[] = [
  {
    id: "youtube",
    name: "YouTube",
    host: "youtube.com",
    pattern: /(?:youtube\.com|youtu\.be|music\.youtube\.com)/i,
  },
  {
    id: "spotify",
    name: "Spotify",
    host: "open.spotify.com",
    pattern: /open\.spotify\.com/i,
    usesExternalTool: true,
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    host: "soundcloud.com",
    pattern: /soundcloud\.com/i,
  },
  {
    id: "bandcamp",
    name: "Bandcamp",
    host: "bandcamp.com",
    pattern: /[\w-]+\.bandcamp\.com|bandcamp\.com/i,
  },
  {
    id: "vimeo",
    name: "Vimeo",
    host: "vimeo.com",
    pattern: /vimeo\.com/i,
  },
  {
    id: "twitter",
    name: "X / Twitter",
    host: "x.com",
    pattern: /(?:twitter\.com|x\.com)\//i,
  },
  {
    id: "tiktok",
    name: "TikTok",
    host: "tiktok.com",
    pattern: /tiktok\.com/i,
  },
] as const;

const GENERIC_AUDIO: PlatformInfo = {
  id: "generic",
  name: "Audio directo",
  host: "URL",
  pattern: /\.(?:mp3|m4a|ogg|opus|wav|flac)(?:\?|$)/i,
};

const UNKNOWN: PlatformInfo = {
  id: "unknown",
  name: "URL desconocida",
  host: "?",
  pattern: /^$/,
};

/**
 * Detecta la plataforma. Si la URL termina en extensión de audio directa,
 * la marcamos como `generic` (yt-dlp puede manejarlo con extractor `Generic`).
 * Si no matchea ninguna conocida, devuelve `unknown` — el servidor probará
 * igual y yt-dlp decidirá.
 */
export function detectPlatform(url: string): PlatformInfo {
  for (const p of PLATFORMS) {
    if (p.pattern.test(url)) return p;
  }
  if (GENERIC_AUDIO.pattern.test(url)) return GENERIC_AUDIO;
  return UNKNOWN;
}

/** Lista de plataformas reconocidas, para mostrar en la landing (Fase 4). */
export const SUPPORTED_PLATFORMS = PLATFORMS.filter((p) => !p.hasDrm);