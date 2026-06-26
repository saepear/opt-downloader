"use client";

import { FloatingNote } from "./FloatingNote";

/**
 * NotesBackground — fixed full-viewport layer of floating musical notes.
 *
 * Sits BETWEEN the BackgroundCanvas (z-0) and the page content (z-10),
 * so notes are visible across every section without ever intercepting
 * clicks (`pointer-events: none`) or screen-reader attention (`aria-hidden`).
 *
 * Each note has its own position, size, color tint, rotation, and animation
 * delay so the layout reads as scattered / organic rather than gridded.
 *
 * Honors `prefers-reduced-motion: reduce` — animations pause, notes stay still.
 *
 * The 8 positions below were hand-tuned (NOT Math.random at render time)
 * to guarantee a stable SSR snapshot and avoid hydration flicker.
 */

interface NoteSpec {
  /** CSS top — % of viewport height */
  top: string;
  /** CSS left — % of viewport width */
  left: string;
  /** size in px */
  size: number;
  /** hue: "purple" | "cyan" | "muted" */
  hue: "purple" | "cyan" | "muted";
  /** base rotation in degrees (will be modulated by tilt animation) */
  rotate: number;
  /** opacity 0..1 */
  opacity: number;
  /** delay in seconds before floatY/tilt start */
  delay: number;
}

const NOTES: readonly NoteSpec[] = [
  { top: "12%", left: "6%", size: 38, hue: "purple", rotate: -14, opacity: 0.22, delay: 0.0 },
  { top: "28%", left: "92%", size: 30, hue: "cyan", rotate: 18, opacity: 0.18, delay: 1.2 },
  { top: "44%", left: "4%", size: 26, hue: "muted", rotate: 8, opacity: 0.14, delay: 2.4 },
  { top: "56%", left: "88%", size: 42, hue: "purple", rotate: -10, opacity: 0.20, delay: 0.6 },
  { top: "68%", left: "12%", size: 22, hue: "cyan", rotate: 22, opacity: 0.16, delay: 3.0 },
  { top: "80%", left: "82%", size: 34, hue: "muted", rotate: -18, opacity: 0.15, delay: 1.8 },
  { top: "20%", left: "48%", size: 20, hue: "purple", rotate: 6, opacity: 0.12, delay: 4.2 },
  { top: "72%", left: "44%", size: 28, hue: "cyan", rotate: -8, opacity: 0.17, delay: 2.7 },
] as const;

const HUE_COLOR: Record<NoteSpec["hue"], string> = {
  purple: "var(--accent)",
  cyan: "var(--cyan)",
  muted: "var(--fg-2)",
};

export function NotesBackground() {
  return (
    <div
      aria-hidden
      className="notes-bg"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1, // sits ABOVE BackgroundCanvas (z-0) and BELOW content (z-10)
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {NOTES.map((n, i) => (
        <span
          key={i}
          className="notes-bg__note"
          style={
            {
              top: n.top,
              left: n.left,
              width: n.size,
              height: n.size,
              color: HUE_COLOR[n.hue],
              opacity: n.opacity,
              transform: `rotate(${n.rotate}deg)`,
              animationDelay: `${n.delay}s`,
            } as React.CSSProperties
          }
        >
          <FloatingNote size={n.size} />
        </span>
      ))}
    </div>
  );
}