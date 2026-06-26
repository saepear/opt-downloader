"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { useLang } from "@/lib/i18n";

/**
 * Renders the title preserving spaces, with each word wrapped in a span.
 */
function AnimatedTitle({
  text,
  variant,
  refEl,
}: {
  text: string;
  variant: "hero" | "platforms";
  refEl: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const words = useMemo(() => text.split(/\s+/), [text]);
  const textShadow =
    variant === "hero"
      ? "0 0 60px rgba(168,85,247,0.18), 0 0 120px rgba(34,211,238,0.10)"
      : "none";
  const wordCls = variant === "platforms" ? "title-word gradient-text-platforms" : "title-word";

  return (
    <div
      ref={refEl}
      className="animated-title"
      style={{
        display: "inline-block",
        color: "#ffffff",
        textShadow,
      }}
    >
      {words.map((word, i) => (
        <span key={i} style={{ whiteSpace: "nowrap" }}>
          {i > 0 && <span className="title-space">{'\u00A0'}</span>}
          <span
            className={wordCls}
            style={{
              display: "inline-block",
              opacity: 1,
              transform: "translate3d(0,0,0) rotateX(0deg)",
              willChange: "transform",
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </div>
  );
}

function BadgeIconSVG({
  paths,
  viewBox = "0 0 24 24",
}: {
  paths: string[];
  viewBox?: string;
}) {
  return (
    <svg
      width={11}
      height={11}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function Hero() {
  const { t } = useLang();
  const title1Ref = useRef<HTMLDivElement>(null);
  const title2Ref = useRef<HTMLDivElement>(null);
  const badgeRowRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    const staggerIn = (container: HTMLDivElement | null, at: number) => {
      if (!container) return;
      const words = container.querySelectorAll<HTMLSpanElement>(".title-word");
      if (words.length === 0) return;
      tl.fromTo(
        words,
        { y: 60, rotateX: -25 },
        { y: 0, rotateX: 0, duration: 0.85, stagger: 0.06, immediateRender: false },
        at
      );
    };

    staggerIn(title1Ref.current, 0.05);
    staggerIn(title2Ref.current, 0.18);

    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        0.55
      );
    }
    if (badgeRowRef.current) {
      tl.fromTo(
        badgeRowRef.current.children,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.05 },
        0.65
      );
    }

    if (haloRef.current) {
      gsap.to(haloRef.current, {
        scale: 1.08,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, []);

  const badges = [
    {
      label: t("hero.badge.320"),
      iconPaths: [
        "M9 18V5l12-2v13",
        "M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z",
      ],
    },
    {
      label: t("hero.badge.fast"),
      iconPaths: ["M13 2L4 14h7l-1 8 9-12h-7l1-8z"],
    },
    {
      label: t("hero.badge.multi"),
      iconPaths: [
        "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20",
        "M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z",
      ],
    },
    {
      label: t("hero.badge.noads"),
      iconPaths: ["M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z"],
    },
  ];

  return (
    <section className="relative z-10 pt-[160px] pb-16 px-6 text-center">
      {/* halo behind title */}
      <div
        ref={haloRef}
        aria-hidden
        style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 720,
          height: 360,
          maxWidth: "90vw",
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(168,85,247,0.18) 0%, rgba(34,211,238,0.06) 40%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="max-w-[920px] mx-auto relative z-10">
        {/* Title — two stacked blocks with explicit gap so they never collapse
            into one line on browsers that collapse inline-block whitespace. */}
        <h1
          className="flex flex-col items-center text-[clamp(48px,7.5vw,88px)] font-[700] tracking-[-0.035em] leading-[0.98] mb-10"
          style={{
            perspective: "1000px",
            gap: "clamp(8px, 1.2vw, 16px)",
          }}
        >
          <AnimatedTitle text={t("hero.title1")} variant="hero" refEl={title1Ref} />
          <AnimatedTitle text={t("hero.title2")} variant="platforms" refEl={title2Ref} />
        </h1>

        {/* Subtitle — sits inside the hero block, with explicit breathing room
            above and below so it never feels glued to the title or to the
            badges that follow. */}
        <p
          ref={subtitleRef}
          className="text-[18px] sm:text-[19px] text-[var(--muted)] max-w-[640px] mx-auto mb-12 leading-[1.65] font-[430]"
          style={{ textWrap: "balance" }}
        >
          {t("hero.subtitle")}
        </p>

        {/* Badge row */}
        <div className="flex flex-col items-center gap-5">
          <div ref={badgeRowRef} className="flex gap-2 justify-center flex-wrap">
            {badges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 px-[14px] py-[7px] rounded-full text-[12px] font-[510] tracking-[0.005em]"
                style={{
                  background: "rgba(168,85,247,0.08)",
                  border: "1px solid rgba(168,85,247,0.18)",
                  color: "var(--fg)",
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(168,85,247,0.14)";
                  e.currentTarget.style.borderColor = "rgba(168,85,247,0.32)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(168,85,247,0.08)";
                  e.currentTarget.style.borderColor = "rgba(168,85,247,0.18)";
                }}
              >
                <span style={{ color: "var(--accent)", display: "inline-flex" }}>
                  <BadgeIconSVG paths={b.iconPaths} />
                </span>
                <span>{b.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}