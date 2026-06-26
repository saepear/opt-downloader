"use client";

import { useLang } from "@/lib/i18n";

function FooterMark() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="footer-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x={1} y={1} width={30} height={30} rx={9} fill="url(#footer-grad)" opacity={0.15} />
      <rect x={1} y={1} width={30} height={30} rx={9} stroke="url(#footer-grad)" strokeWidth={1} opacity={0.5} />
      <path
        d="M14 8v13.5"
        stroke="url(#footer-grad)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M14 8c4 0 6 2 6 5s-2 5-6 5"
        stroke="url(#footer-grad)"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx={12} cy={22} rx={3} ry={2.2} fill="url(#footer-grad)" />
    </svg>
  );
}

export function Footer() {
  const { t } = useLang();

  return (
    <footer
      className="relative z-10 mt-12"
      style={{
        borderTop: "1px solid var(--border)",
        background:
          "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.015) 100%)",
      }}
    >
      <div
        className="max-w-[1180px] mx-auto px-6 py-12"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 40,
        }}
      >
        {/* Brand column */}
        <div className="flex flex-col gap-3 max-w-[280px]">
          <div className="flex items-center gap-2.5">
            <FooterMark />
            <span className="text-base font-[650] tracking-[-0.02em]">
              Pure<span className="gradient-text-platforms">MP3</span>
            </span>
          </div>
          <p
            className="text-xs text-[var(--muted)] leading-[1.7]"
            style={{ textWrap: "pretty" }}
          >
            {t("footer.tagline")}
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-1 text-[11px] text-[var(--muted)]"
            style={{ letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 510 }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px rgba(34,197,94,0.6)",
              }}
            />
            {t("footer.status")}
          </div>
        </div>

        {/* Product column */}
        <div className="flex flex-col gap-2.5">
          <h4
            className="text-[11px] uppercase tracking-[0.08em] text-[var(--fg)]"
            style={{ fontWeight: 650, marginBottom: 6 }}
          >
            {t("footer.col.product")}
          </h4>
          <a
            href="#features"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--fg)] transition-colors w-fit"
          >
            {t("footer.features")}
          </a>
          <a
            href="#how-it-works"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--fg)] transition-colors w-fit"
          >
            {t("footer.how")}
          </a>
          <a
            href="#faq"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--fg)] transition-colors w-fit"
          >
            {t("footer.faq_link")}
          </a>
          <a
            href="/playlist"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--fg)] transition-colors w-fit"
          >
            {t("footer.playlists")}
          </a>
        </div>

        {/* Social column */}
        <div className="flex flex-col gap-3">
          <h4
            className="text-[11px] uppercase tracking-[0.08em] text-[var(--fg)]"
            style={{ fontWeight: 650, marginBottom: 6 }}
          >
            {t("footer.col.community")}
          </h4>
          <p className="text-xs text-[var(--muted)] leading-[1.6]">
            {t("footer.community_text")}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {/* GitHub */}
            <a
              href="#"
              aria-label="GitHub"
              className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--fg)";
                e.currentTarget.style.borderColor = "var(--border-active)";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="max-w-[1180px] mx-auto px-6 py-6 flex flex-wrap justify-between items-center gap-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span className="text-xs text-[var(--muted)]">
          © 2026 PureMP3 · {t("footer.rights")}
        </span>
        <span className="text-[11px] text-[var(--muted-light)]">
          {t("footer.built_with")}
        </span>
      </div>
    </footer>
  );
}