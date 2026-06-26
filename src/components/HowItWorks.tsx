"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLang } from "@/lib/i18n";

function StepCard({ icon, title, desc, index }: { icon: string; title: string; desc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { y: 0, opacity: 1 });
    const tween = gsap.fromTo(el,
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, delay: index * 0.2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
      }
    );
    return () => { tween.scrollTrigger?.kill(); };
  }, [index]);

  return (
    <div ref={ref} className="text-center">
      <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
        style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
      >
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <h3 className="text-lg font-[600] mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed max-w-[240px] mx-auto">{desc}</p>
    </div>
  );
}

export function HowItWorks() {
  const { t } = useLang();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  const steps = [
    { icon: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71", title: t("how.paste.title"), desc: t("how.paste.desc") },
    { icon: "M4 21v-7M4 10V3M12 21v-9M12 12V3M20 21v-5M20 16V3M1 14h6M9 12h6M17 16h6", title: t("how.select.title"), desc: t("how.select.desc") },
    { icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3", title: t("how.download.title"), desc: t("how.download.desc") },
  ];

  return (
    <section id="how-it-works">
      <div className="section-wrap text-center">
        <div className="mb-[60px]">
          <div className="section-label">{t("how.label")}</div>
          <h2 className="section-title">{t("how.title")}</h2>
          <p className="section-sub" style={{ margin: "0 auto" }}>{t("how.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-[900px] mx-auto">
          {steps.map((step, i) => (
            <StepCard key={step.title} {...step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
