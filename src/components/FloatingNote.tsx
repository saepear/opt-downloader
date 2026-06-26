"use client";

/**
 * FloatingNote — musical note SVG used as decorative background element.
 * Renders the eighth-note icon (path + two heads) at a configurable size.
 * Color is inherited from `currentColor` so it can be themed via CSS or
 * an inline `color` style. The component itself does NOT animate — the
 * parent <NotesBackground> wraps each note with motion via CSS classes.
 *
 * Source: inspired by Lucide / Feather (CC0 / public domain path geometry).
 */

export interface FloatingNoteProps {
  /** size in pixels (square bounding box, viewBox is 24×24) */
  size?: number;
  /** additional className — used by <NotesBackground> for per-note animation */
  className?: string;
  /** inline style — used to set color / position */
  style?: React.CSSProperties;
}

export function FloatingNote({
  size = 28,
  className,
  style,
}: FloatingNoteProps) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2003/svg"
      className={className}
      style={style}
    >
      <path
        d="M9 18V5l12-2v13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6"
        cy="18"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <circle
        cx="18"
        cy="16"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="currentColor"
        fillOpacity="0.18"
      />
    </svg>
  );
}