"use client";

import { forwardRef, useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { magneticHover } from "@/lib/animations";

type Variant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  magnetic?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-black hover:brightness-110",
  ghost: "bg-transparent text-foreground border border-white/10 hover:bg-white/5",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", magnetic = false, className = "", children, ...rest },
    ref
  ) {
    const innerRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
      if (!magnetic) return;
      const el = innerRef.current;
      if (!el) return;
      const cleanup = magneticHover(el);
      return cleanup;
    }, [magnetic]);

    return (
      <button
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={`${base} ${variants[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);