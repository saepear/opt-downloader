"use client";

import { gsap } from "gsap";

/**
 * Helpers de animación reutilizables. Todas las funciones están diseñadas para
 * ser llamadas desde componentes "use client" — GSAP accede a window/DOM.
 *
 * Animaciones cortitas (≤0.6s) y con `prefers-reduced-motion` respetado a nivel
 * global en globals.css (media query que desactiva animaciones).
 */

export const fadeUp = (el: gsap.DOMTarget, delay = 0): gsap.core.Tween =>
  gsap.from(el, {
    y: 24,
    opacity: 0,
    duration: 0.6,
    ease: "power3.out",
    delay,
  });

export const staggerChildren = (
  parent: gsap.DOMTarget,
  childSelector = ":scope > *"
): gsap.core.Timeline => {
  const root =
    typeof parent === "string"
      ? document.querySelector(parent)
      : (parent as gsap.TweenTarget);
  if (!root) return gsap.timeline();
  const children = (root as Element).querySelectorAll(childSelector);
  return gsap.timeline().from(children, {
    y: 16,
    opacity: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power2.out",
  });
};

export const magneticHover = (el: HTMLElement): (() => void) => {
  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, {
      x: (e.clientX - r.left - r.width / 2) * 0.2,
      y: (e.clientY - r.top - r.height / 2) * 0.2,
      duration: 0.3,
      ease: "power2.out",
    });
  };
  const onLeave = () =>
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  return () => {
    el.removeEventListener("mousemove", onMove);
    el.removeEventListener("mouseleave", onLeave);
  };
};

export const shake = (el: gsap.DOMTarget): gsap.core.Tween =>
  gsap.fromTo(
    el,
    { x: -6 },
    { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
  );