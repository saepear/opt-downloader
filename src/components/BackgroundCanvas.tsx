"use client";

import { useEffect, useRef } from "react";

export function BackgroundCanvas() {
  const purpleRef = useRef<HTMLDivElement>(null);
  const cyanRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const gp = purpleRef.current;
      const gc = cyanRef.current;
      if (gp) {
        const x = (e.clientX / window.innerWidth - 0.5) * 40;
        const y = (e.clientY / window.innerHeight - 0.5) * 30;
        gp.style.transform = `translate(${x}px, ${y}px)`;
      }
      if (gc) {
        const x = (e.clientX / window.innerWidth - 0.5) * -30;
        const y = (e.clientY / window.innerHeight - 0.5) * -20;
        gc.style.transform = `translate(${x}px, ${y}px)`;
      }
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div className="bg-canvas" aria-hidden>
      <div className="gradient-mesh" />
      <div className="noise-overlay" />
      <div className="vignette" />
      <div ref={purpleRef} className="radial-glow purple" />
      <div ref={cyanRef} className="radial-glow cyan" />
    </div>
  );
}
