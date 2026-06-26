"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";

interface FaqItem {
  q: string;
  a: string;
}

export function FAQSection() {
  const { t } = useLang();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
  ];

  return (
    <section id="faq">
      <div className="section-wrap text-center">
        <div className="mb-10">
          <div className="section-label">{t("faq.label")}</div>
          <h2 className="section-title">{t("faq.title")}</h2>
          <p
            className="section-sub mx-auto"
            style={{ margin: "0 auto", textWrap: "balance" }}
          >
            {t("faq.subtitle")}
          </p>
        </div>

        <div className="max-w-[720px] mx-auto text-left flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const open = openIdx === i;
            return (
              <div
                key={i}
                className="glass-card rounded-[var(--radius-lg)] overflow-hidden transition-[border-color,background] duration-300"
                style={{
                  border: `1px solid ${open ? "rgba(168,85,247,0.28)" : "var(--border)"}`,
                  background: open
                    ? "linear-gradient(180deg, rgba(168,85,247,0.06) 0%, rgba(255,255,255,0.02) 100%)"
                    : undefined,
                  boxShadow: open
                    ? "0 0 0 1px rgba(168,85,247,0.18), 0 16px 40px -16px rgba(168,85,247,0.25)"
                    : "none",
                }}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="w-full py-[18px] px-5 flex items-center justify-between gap-4 text-left text-[15px] font-[560] text-[var(--fg)] cursor-pointer bg-transparent border-none"
                  style={{ letterSpacing: "-0.005em" }}
                  aria-expanded={open}
                >
                  <span>{faq.q}</span>
                  <span
                    aria-hidden
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: open
                        ? "rgba(168,85,247,0.18)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${open ? "rgba(168,85,247,0.35)" : "var(--border)"}`,
                      color: open ? "var(--accent)" : "var(--muted)",
                      transition:
                        "transform 0.35s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1)), background 0.3s, border-color 0.3s, color 0.3s",
                      transform: open ? "rotate(45deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width={14}
                      height={14}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-[max-height,opacity] duration-[400ms]"
                  style={{
                    maxHeight: open ? 320 : 0,
                    opacity: open ? 1 : 0,
                  }}
                >
                  <p
                    className="px-5 pb-[20px] text-[14px] text-[var(--muted)] leading-[1.7]"
                    style={{ textWrap: "pretty" }}
                  >
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-xs text-[var(--muted)]">
          {t("faq.more_questions")}{" "}
          <a
            href="#"
            className="text-[var(--accent)] opacity-80 hover:opacity-100 transition-opacity underline-offset-4 hover:underline"
          >
            {t("faq.contact")}
          </a>
        </p>
      </div>
    </section>
  );
}