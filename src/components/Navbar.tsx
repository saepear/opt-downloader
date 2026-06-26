"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useLang } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function BrandMark() {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x={1} y={1} width={30} height={30} rx={9} fill="url(#brand-grad)" opacity={0.15} />
      <rect x={1} y={1} width={30} height={30} rx={9} stroke="url(#brand-grad)" strokeWidth={1} opacity={0.5} />
      {/* Stylized eighth-note with waveform tail */}
      <path
        d="M14 8v13.5"
        stroke="url(#brand-grad)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M14 8c4 0 6 2 6 5s-2 5-6 5"
        stroke="url(#brand-grad)"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx={12} cy={22} rx={3} ry={2.2} fill="url(#brand-grad)" />
    </svg>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  onAnchor?: boolean;
}

function NavLink({ href, children, onClick, onAnchor }: NavLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onAnchor && href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    onClick?.();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="px-3 py-2 text-sm font-[450] rounded-[8px] text-[var(--muted)] transition-[color,background,transform] duration-200 hover:text-[var(--fg)] hover:bg-[var(--surface)] active:scale-[0.97]"
    >
      {children}
    </Link>
  );
}

function LoginButton({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="login-cta group relative inline-flex items-center gap-1 px-3.5 py-1.5 text-sm font-[510] rounded-[8px] text-white overflow-hidden"
    >
      <span className="login-cta-bg" aria-hidden />
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="login-cta-arrow transition-transform duration-300 group-hover:translate-x-0.5"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </span>
      <style jsx>{`
        .login-cta-bg {
          position: absolute;
          inset: 0;
          background: var(--gradient-accent);
          border-radius: inherit;
          transition: box-shadow 0.3s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .login-cta:hover .login-cta-bg {
          box-shadow: 0 0 30px var(--accent-glow), inset 0 0 0 1px rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </Link>
  );
}

export function Navbar() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.05 }
    );
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className="navbar-root"
        data-scrolled={scrolled}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: scrolled ? "10px 20px" : "16px 20px",
        }}
      >
        <div
          className="navbar-shell"
          data-scrolled={scrolled}
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: scrolled ? "8px 12px 8px 16px" : "10px 14px 10px 18px",
            background: scrolled ? "rgba(10,10,14,0.72)" : "rgba(10,10,14,0.45)",
            backdropFilter: scrolled ? "blur(20px)" : "blur(14px)",
            WebkitBackdropFilter: scrolled ? "blur(20px)" : "blur(14px)",
            border: "1px solid",
            borderColor: scrolled ? "var(--border-active)" : "var(--border)",
            borderRadius: 999,
            boxShadow: scrolled
              ? "0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)"
              : "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
            transition:
              "padding 0.4s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)), background 0.4s, border-color 0.4s, box-shadow 0.4s",
          }}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="PureMP3 home"
          >
            <BrandMark />
            <span className="text-[15px] font-[650] tracking-[-0.02em] text-[var(--fg)]">
              Pure<span className="gradient-text-platforms">MP3</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            <NavLink href="/search">{t("nav.search")}</NavLink>
            <NavLink href="/history">{t("nav.history")}</NavLink>
            <NavLink href="#features" onAnchor>
              {t("nav.features")}
            </NavLink>
            <NavLink href="#faq" onAnchor>
              {t("nav.faq")}
            </NavLink>
            <div className="mx-2 h-5 w-px bg-[var(--border)]" aria-hidden />
            <div className="mr-2">
              <LanguageSwitcher />
            </div>
            <LoginButton href="/login">{t("nav.login")}</LoginButton>
          </div>

          <button
            className="md:hidden flex flex-col gap-[5px] p-2 bg-transparent border border-[var(--border)] rounded-[10px] cursor-pointer transition-colors hover:bg-[var(--surface)]"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span
              className="block w-[18px] h-[2px] bg-[var(--fg)] rounded-sm transition-all duration-300"
              style={{
                transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "none",
              }}
            />
            <span
              className="block w-[18px] h-[2px] bg-[var(--fg)] rounded-sm transition-all duration-300"
              style={{ opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block w-[18px] h-[2px] bg-[var(--fg)] rounded-sm transition-all duration-300"
              style={{
                transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="nav-overlay animate-[fade-in_0.25s_ease-out]">
          <div className="flex flex-col items-center gap-1.5 w-full max-w-[320px]">
            <div className="flex items-center gap-2.5 mb-2">
              <BrandMark />
              <span className="text-base font-[650] tracking-[-0.02em]">
                Pure<span className="gradient-text-platforms">MP3</span>
              </span>
            </div>
            <div
              style={{
                height: 1,
                width: "100%",
                background: "var(--border)",
                marginBottom: 8,
              }}
            />
            <div className="flex gap-2 w-full justify-center mb-2">
              <LanguageSwitcher />
            </div>
            <NavLink href="/search" onClick={() => setMenuOpen(false)}>
              {t("nav.search")}
            </NavLink>
            <NavLink href="/history" onClick={() => setMenuOpen(false)}>
              {t("nav.history")}
            </NavLink>
            <LoginButton href="/login" onClick={() => setMenuOpen(false)}>
              {t("nav.login")}
            </LoginButton>
          </div>
        </div>
      )}
    </>
  );
}