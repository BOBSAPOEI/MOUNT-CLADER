"use client";

import { useEffect, useState } from "react";

/** `dark` = navy ink (for light backdrops), `light` = white ink (for dark backdrops). */
export type Theme = "dark" | "light";

/**
 * Returns the theme of whichever `[data-chapter-theme]` block is under a probe line of the viewport.
 * `probe` receives the viewport height and returns the y coordinate to test.
 */
export function useThemeAt(probe: (vh: number) => number): Theme {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = probe(window.innerHeight);
      let found: Theme = "dark";
      document.querySelectorAll<HTMLElement>("[data-chapter-theme]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) found = el.dataset.chapterTheme as Theme;
      });
      setTheme(found);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [probe]);

  return theme;
}
