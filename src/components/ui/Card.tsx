"use client";

import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({
  children,
  interactive = false,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm ${
        interactive ? "cursor-pointer hover:border-accent/50 hover:bg-white/[0.06] transition-colors" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}