"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLang } from "@/lib/i18n";

function FeatureCard({ icon, title, desc, index }: { icon: React.ReactNode; title: string; desc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { y: 0, opacity: 1 });
    const tween = gsap.fromTo(el,
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, delay: index * 0.15, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
      }
    );
    return () => { tween.scrollTrigger?.kill(); };
  }, [index]);

  return (
    <div
      ref={ref}
      className="p-[36px_28px] rounded-[var(--radius-lg)] backdrop-blur-[12px] relative overflow-hidden transition-[transform,border-color] duration-300"
      style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
        animation: `card-float 4s ease-in-out ${index * 0.5}s infinite alternate`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-10px) scale(1.02)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.25)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div className="w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center mb-[18px]"
        style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.15)" }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon}
        </svg>
      </div>
      <h3 className="text-lg font-[600] mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

export function FeaturesSection() {
  const { t } = useLang();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  // Iconos SVG inline desde Iconify (CC0/MIT/Apache 2.0). Sources:
  //   multi-platform  → streamline-cyber:multi-platform-2
  //   quality         → material-symbols:high-quality-outline
  //   privacy         → material-symbols:privacy-tip-outline
  const features = [
    {
      // Streamline Cyber — multi-platform-2
      icon: (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10}>
          <path d="M5.5 13.5h-5v8h5zm-5 6h5" />
          <path d="M2.5 11.498V8.5h8v11h-3" />
          <path d="M4.5 6.499V3.5h18v14h-10m-2 0h-3m15-3h-10m1 3v4m-4 0h8M17 5.999L20 9m-.5-3.501l1 1" />
        </g>
      ),
      title: t("features.multi.title"),
      desc: t("features.multi.desc"),
    },
    {
      // Material Symbols — high-quality-outline
      icon: (
        <path
          fill="currentColor"
          d="M14.75 16.5h1.5V15H17q.425 0 .713-.288T18 14v-4q0-.425-.288-.712T17 9h-3q-.425 0-.712.288T13 10v4q0 .425.288.713T14 15h.75zM6 15h1.5v-2h2v2H11V9H9.5v2.5h-2V9H6zm8.5-1.5v-3h2v3zM4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm0-2h16V6H4zm0 0V6z"
        />
      ),
      title: t("features.quality.title"),
      desc: t("features.quality.desc"),
    },
    {
      // Material Symbols — privacy-tip-outline
      icon: (
        <path
          fill="currentColor"
          d="M11 17h2v-6h-2zm1.713-8.287Q13 8.425 13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9t.713-.288M12 22q-3.475-.875-5.738-3.988T4 11.1V5l8-3l8 3v6.1q0 3.8-2.262 6.913T12 22m0-2.1q2.6-.825 4.3-3.3t1.7-5.5V6.375l-6-2.25l-6 2.25V11.1q0 3.025 1.7 5.5t4.3 3.3m0-7.9"
        />
      ),
      title: t("features.private.title"),
      desc: t("features.private.desc"),
    },
  ];

  return (
    <section id="features">
      <div className="section-wrap">
        <div className="text-center mb-[60px]">
          <div className="section-label">{t("features.label")}</div>
          <h2 className="section-title">{t("features.title")}</h2>
          <p className="section-sub" style={{ margin: "0 auto" }}>{t("features.subtitle")}</p>
        </div>
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
