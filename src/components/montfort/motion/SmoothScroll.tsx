"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

/** Lenis smooth scrolling. `locked` freezes the page (e.g. while the menu overlay is open). */
export function SmoothScroll({ locked = false }: { locked?: boolean }) {
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({ lerp: 0.1 });
    lenis.current = instance;
    let raf = 0;
    const tick = (t: number) => {
      instance.raf(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const top = () => instance.scrollTo(0, { duration: 1.6 });
    window.addEventListener("mf:scroll-top", top);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mf:scroll-top", top);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  useEffect(() => {
    if (locked) lenis.current?.stop();
    else lenis.current?.start();
  }, [locked]);

  return null;
}
