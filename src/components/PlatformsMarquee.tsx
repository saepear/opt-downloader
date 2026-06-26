"use client";

import { useLang } from "@/lib/i18n";

interface Platform {
  id: string;
  name: string;
  /** SVG path data (viewBox 0 0 24 24) for the brand mark */
  path: string;
  /** Display color for the path stroke/fill */
  color: string;
  /** Optional accent for gradient backgrounds */
  accent?: string;
}

/**
 * Brand mark data sourced from Simple Icons (https://simpleicons.org),
 * CC0 1.0 (public domain). Fetched via the Iconify API at build time.
 *
 * Each `path` is the canonical brand glyph. The viewBox is `0 0 24 24`.
 * To render, we wrap each path in an <svg> and use `currentColor` so the
 * `color` field (the brand's official hex) is what paints the glyph.
 */
const PLATFORMS: Platform[] = [
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    path: "M23.498 6.186a3.02 3.02 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.02 3.02 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.02 3.02 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.02 3.02 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814M9.545 15.568V8.432L15.818 12z",
  },
  {
    id: "spotify",
    name: "Spotify",
    color: "#1DB954",
    path: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12s12-5.4 12-12S18.66 0 12 0m5.521 17.34c-.24.359-.66.48-1.021.24c-2.82-1.74-6.36-2.101-10.561-1.141c-.418.122-.779-.179-.899-.539c-.12-.421.18-.78.54-.9c4.56-1.021 8.52-.6 11.64 1.32c.42.18.479.659.301 1.02m1.44-3.3c-.301.42-.841.6-1.262.3c-3.239-1.98-8.159-2.58-11.939-1.38c-.479.12-1.02-.12-1.14-.6s.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2m.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721c-.18-.601.18-1.2.72-1.381c4.26-1.26 11.28-1.02 15.721 1.621c.539.3.719 1.02.419 1.56c-.299.421-1.02.599-1.559.3",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    color: "#FF5500",
    path: "M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.75.75 0 0 1 .452-.724s.75-.513 2.333-.513a5.36 5.36 0 0 1 2.763.755a5.43 5.43 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12c.884 0 1.73.358 2.347.992s.948 1.49.922 2.373M10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0M9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0m-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0m-1.647.77a26 26 0 0 1-.008 7.147a.272.272 0 0 1-.542 0a28 28 0 0 1 0-7.147a.275.275 0 0 1 .55 0m-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412c-.026.28-.514.283-.54 0c-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0m-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0",
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#25F4EE",
    accent: "#FE2C55",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02c.08 1.53.63 3.09 1.75 4.17c1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97c-.57-.26-1.1-.59-1.62-.93c-.01 2.92.01 5.84-.02 8.75c-.08 1.4-.54 2.79-1.35 3.94c-1.31 1.92-3.58 3.17-5.91 3.21c-1.43.08-2.86-.31-4.08-1.03c-2.02-1.19-3.44-3.37-3.65-5.71c-.02-.5-.03-1-.01-1.49c.18-1.9 1.12-3.72 2.58-4.96c1.66-1.44 3.98-2.13 6.15-1.72c.02 1.48-.04 2.96-.04 4.44c-.99-.32-2.15-.23-3.02.37c-.63.41-1.11 1.04-1.36 1.75c-.21.51-.15 1.07-.14 1.61c.24 1.64 1.82 3.02 3.5 2.87c1.12-.01 2.19-.66 2.77-1.61c.19-.33.4-.67.41-1.06c.1-1.79.06-3.57.07-5.36c.01-4.03-.01-8.05.02-12.07",
  },
  {
    id: "bandcamp",
    name: "Bandcamp",
    color: "#629AA9",
    path: "m0 18.75l7.437-13.5H24l-7.438 13.5z",
  },
  {
    id: "vimeo",
    name: "Vimeo",
    color: "#1AB7EA",
    path: "M23.977 6.417c-.105 2.338-1.74 5.543-4.894 9.609c-3.268 4.247-6.026 6.37-8.29 6.37c-1.41 0-2.578-1.294-3.553-3.881L5.322 11.4Q4.244 7.524 3.01 7.523q-.27 0-1.881 1.132l-1.13-1.457A315 315 0 0 0 3.502 4.07C5.08 2.702 6.266 1.985 7.055 1.91q2.8-.27 3.447 3.839q.698 4.43.97 5.507q.81 3.675 1.777 3.674q.752 0 2.265-2.385q1.505-2.383 1.612-3.628c.144-1.371-.395-2.061-1.614-2.061c-.574 0-1.167.12-1.777.39C14.92 3.38 17.169 1.49 20.497 1.61c2.473.06 3.628 1.664 3.493 4.797z",
  },
  {
    id: "x",
    name: "X",
    color: "#FFFFFF",
    path: "M14.234 10.162L22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299l-.929-1.329L3.076 1.56h3.182l5.965 8.532l.929 1.329l7.754 11.09h-3.182z",
  },
  {
    id: "applemusic",
    name: "Apple Music",
    color: "#FA243C",
    path: "M23.994 6.124a9.2 9.2 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5 5 0 0 0-1.877-.726a10.5 10.5 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986q-.227.014-.455.026c-.747.043-1.49.123-2.193.4c-1.336.53-2.3 1.452-2.865 2.78c-.192.448-.292.925-.363 1.408a11 11 0 0 0-.1 1.18c0 .032-.007.062-.01.093v12.223l.027.424c.05.815.154 1.624.497 2.373c.65 1.42 1.738 2.353 3.234 2.801c.42.127.856.187 1.293.228c.555.053 1.11.06 1.667.06h11.03a13 13 0 0 0 1.57-.1c.822-.106 1.596-.35 2.295-.81a5.05 5.05 0 0 0 1.88-2.207c.186-.42.293-.87.37-1.324c.113-.675.138-1.358.137-2.04c-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206c-.29.59-.76.962-1.388 1.14q-.524.15-1.07.173c-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 0 1 1.038-2.022c.323-.16.67-.25 1.018-.324c.378-.082.758-.153 1.134-.24c.274-.063.457-.23.51-.516a1 1 0 0 0 .02-.193q0-2.723-.002-5.443a.7.7 0 0 0-.026-.185c-.04-.15-.15-.243-.304-.234c-.16.01-.318.035-.475.066q-1.14.226-2.28.456l-2.325.47l-1.374.278l-.048.013c-.277.077-.377.203-.39.49q-.002.063 0 .13c-.002 2.602 0 5.204-.003 7.805c0 .42-.047.836-.215 1.227c-.278.64-.77 1.04-1.434 1.233q-.526.152-1.075.172c-.96.036-1.755-.6-1.92-1.544c-.14-.812.23-1.685 1.154-2.075c.357-.15.73-.232 1.108-.31c.287-.06.575-.116.86-.177q.574-.126.6-.714v-.15l.002-8.882c0-.123.013-.25.042-.37c.07-.285.273-.448.546-.518c.255-.066.515-.112.774-.165q1.1-.224 2.2-.444l2.27-.46l2.01-.403c.22-.043.442-.088.663-.106c.31-.025.523.17.554.482q.012.11.012.223q.003 2.866 0 5.732z",
  },
  {
    id: "deezer",
    name: "Deezer",
    color: "#A238FF",
    path: "M.693 10.024c.381 0 .693-1.256.693-2.807S1.074 4.41.693 4.41S0 5.666 0 7.217s.312 2.808.693 2.808ZM21.038 1.56c-.364 0-.684.805-.91 2.096C19.765 1.446 19.184 0 18.526 0c-.78 0-1.464 2.036-1.784 5c-.312-2.158-.788-3.536-1.325-3.536c-.745 0-1.386 2.704-1.62 6.472c-.442-1.932-1.083-3.145-1.793-3.145s-1.35 1.213-1.793 3.145c-.242-3.76-.874-6.463-1.628-6.463c-.537 0-1.013 1.378-1.325 3.535C6.938 2.036 6.262 0 5.474 0c-.658 0-1.247 1.447-1.602 3.665c-.217-1.291-.546-2.105-.91-2.105c-.675 0-1.221 2.807-1.221 6.272s.546 6.273 1.221 6.273c.277 0 .537-.476.736-1.273c.32 2.928.996 4.938 1.776 4.938c.606 0 1.143-1.204 1.507-3.11c.251 3.622.875 6.195 1.602 6.195c.46 0 .875-1.023 1.187-2.677C10.142 21.6 11 24 12.004 24s1.863-2.4 2.235-5.822c.312 1.654.727 2.677 1.186 2.677c.728 0 1.352-2.573 1.603-6.195c.364 1.906.9 3.11 1.507 3.11c.78 0 1.455-2.01 1.775-4.938c.208.797.46 1.273.737 1.273c.675 0 1.22-2.807 1.22-6.273c-.008-3.457-.553-6.272-1.23-6.272Zm2.269 8.464c.381 0 .693-1.256.693-2.807s-.312-2.807-.693-2.807s-.693 1.256-.693 2.807s.312 2.808.693 2.808Z",
  },
  {
    id: "mixcloud",
    name: "Mixcloud",
    color: "#5000FF",
    path: "m2.462 8.596l1.372 6.49h.319l1.372-6.49h2.462v6.808H6.742v-5.68l.232-.81h-.402l-1.43 6.49H2.854l-1.44-6.49h-.391l.222.81v5.68H0V8.596zM24 8.63v1.429L21.257 12L24 13.941v1.43l-3.235-2.329h-.348l-3.226 2.329v-1.43l2.734-1.94l-2.733-1.942V8.63l3.225 2.338h.348zm-7.869 2.75v1.24H9.304v-1.24z",
  },
];

/**
 * Renders an SVG path with the brand's official color.
 *
 * Simple Icons paths use `fill="currentColor"`, so we set the SVG's `color`
 * CSS property to the brand hex — this lets the SVG inherit color in CSS
 * (hover, theme, etc.) while still painting with the official brand hue.
 *
 * For TikTok (dual-color chromatic aberration) we layer two paths: the main
 * cyan layer and a slightly offset pink layer underneath.
 */
function BrandMark({ p }: { p: Platform }) {
  if (p.id === "tiktok") {
    return (
      <span className="platform-mark" aria-hidden>
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          style={{ color: p.color }}
        >
          <path d={p.path} fill="currentColor" />
          <path
            d={p.path}
            transform="translate(-1.2,1.2)"
            fill={p.accent}
            opacity={0.85}
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="platform-mark" aria-hidden>
      <svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        style={{ color: p.color }}
      >
        <path d={p.path} fill="currentColor" />
      </svg>
    </span>
  );
}

function MarqueeRow({
  items,
  variant,
}: {
  items: Platform[];
  variant: 1 | 2;
}) {
  // Quadruple the array so `translateX(-25%)` is geometrically perfect:
  // the row has width = 4× one-copy, so -25% translates exactly one full
  // copy. The chip that lands at x=0 at the end of the cycle is identical
  // to the one at x=0 at the start, so the loop is seamless with NO reset.
  // Two copies would leave the stream narrower than 2× the container on
  // wide viewports, so we quadruple to guarantee coverage at any width.
  const stream = [...items, ...items, ...items, ...items];
  return (
    <div
      className={`marquee-row row-${variant}`}
      aria-hidden={variant === 2 ? "true" : undefined}
    >
      {stream.map((p, i) => (
        <span key={`${variant}-${p.id}-${i}`} className="platform-chip">
          <BrandMark p={p} />
          <span className="platform-label">{p.name}</span>
        </span>
      ))}
    </div>
  );
}

export function PlatformsMarquee() {
  const { t } = useLang();

  // Use the full platform list for both rows so the stream is wide enough
  // to cover any viewport without gaps during the keyframe loop.
  const row1 = PLATFORMS;
  const row2 = [...PLATFORMS.slice(3), ...PLATFORMS.slice(0, 3)];

  return (
    <section
      className="relative z-10 overflow-hidden py-12"
      aria-labelledby="platforms-heading"
    >
      <div className="mb-7 text-center">
        <div className="section-label">{t("platforms.label")}</div>
        <h2
          id="platforms-heading"
          className="text-[clamp(20px,2.4vw,28px)] font-[650] tracking-[-0.02em] text-[var(--fg)]"
        >
          {t("platforms.title")}
        </h2>
      </div>
      <div className="marquee-content">
        <MarqueeRow items={row1} variant={1} />
        <MarqueeRow items={row2} variant={2} />
      </div>
    </section>
  );
}