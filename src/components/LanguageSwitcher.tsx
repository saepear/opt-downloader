"use client";

import { useRef, useState, useEffect } from "react";
import { useLang, type Lang } from "@/lib/i18n";

function Flag({ lang }: { lang: Lang }) {
  return (
    <svg width={15} height={20} viewBox="0 0 24 16" style={{ borderRadius: 2, flexShrink: 0, display: "block" }}>
      {lang === "es" ? (
        <g>
          <rect x={0} y={0} width={24} height={16} fill="#c60b1e" />
          <rect x={0} y={4} width={24} height={8} fill="#ffc400" />
        </g>
      ) : (
        <g>
          <rect x={0} y={0} width={24} height={16} fill="#fff" />
          {[0, 2, 4, 6, 8, 10, 12].map((y) => (
            <rect key={y} x={0} y={y} width={24} height={1.33} fill="#b22234" />
          ))}
          <rect x={0} y={0} width={10.5} height={9} fill="#3c3b6e" />
        </g>
      )}
    </svg>
  );
}

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options: { id: Lang; label: string }[] = [
    { id: "en", label: "English" },
    { id: "es", label: "Español" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "6px 10px", borderRadius: "var(--radius-sm)",
          fontSize: 11, fontWeight: 510,
          color: "var(--muted)", background: "transparent",
          border: "1px solid var(--border)", cursor: "pointer",
          transition: "color 0.2s, background 0.2s, border-color 0.2s",
          letterSpacing: "0.02em", textTransform: "uppercase",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--fg)";
          e.currentTarget.style.background = "var(--surface)";
          e.currentTarget.style.borderColor = "var(--border-active)";
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border)";
          }
        }}
      >
        <Flag lang={lang} />
        <span>{lang === "en" ? "EN" : "ES"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "100%", right: 0, marginTop: 6,
            background: "rgba(18,18,24,0.96)", backdropFilter: "blur(24px)",
            border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
            padding: 4, minWidth: 150, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            zIndex: 200,
          }}
        >
          {options.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setLang(id); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 12px",
                borderRadius: "var(--radius-sm)", fontSize: 14,
                fontWeight: lang === id ? 600 : 450,
                color: lang === id ? "var(--fg)" : "var(--muted)",
                background: lang === id ? "rgba(168,85,247,0.12)" : "transparent",
                border: "none", cursor: "pointer", transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = lang === id ? "rgba(168,85,247,0.12)" : "transparent";
              }}
            >
              <Flag lang={id} />
              <span>{label}</span>
              {lang === id && (
                <span style={{ marginLeft: "auto", color: "var(--accent)" }}>
                  <svg width={100} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
