"use client";

import { useEffect, useRef, type ElementType } from "react";
import { mixColor, parseColor } from "./color";

interface ScrubTextProps {
  as?: ElementType;
  className?: string;
  /** Colour of a line before it has scrolled into reading position. */
  from: string;
  /** Final colour once the line is in reading position. */
  to: string;
  children: string;
}

/**
 * Headline whose lines change colour one by one as they travel up the viewport
 * (scroll-scrubbed, like the original). Words are measured to group them into lines.
 */
export function ScrubText({ as: Tag = "h2", className = "", from, to, children }: ScrubTextProps) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
    const a = parseColor(from);
    const b = parseColor(to);
    let lines: HTMLElement[][] = [];
    let visible = false;
    let raf = 0;

    const split = () => {
      lines = [];
      let last = Number.NEGATIVE_INFINITY;
      for (const w of words) {
        if (Math.abs(w.offsetTop - last) > 3) {
          lines.push([]);
          last = w.offsetTop;
        }
        lines[lines.length - 1].push(w);
      }
    };

    const paint = () => {
      raf = 0;
      const vh = window.innerHeight;
      // On phones a headline spans most of the screen, so its lines finish colouring soon after they appear.
      const phone = window.innerWidth < 768;
      for (const line of lines) {
        const top = line[0].getBoundingClientRect().top;
        const p = phone ? (vh - top) / (vh * 0.2) : (vh * 0.92 - top) / (vh * 0.3);
        const color = mixColor(a, b, p);
        for (const w of line) w.style.color = color;
      }
    };

    const schedule = () => {
      if (visible && !raf) raf = requestAnimationFrame(paint);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        schedule();
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    io.observe(el);
    const relayout = () => {
      split();
      schedule();
    };
    relayout();
    document.fonts?.ready.then(relayout);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", relayout);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", relayout);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [from, to]);

  return (
    <Tag ref={root} className={className} data-scrub-light={/^(#fff(fff)?|white)$/i.test(to) ? "" : undefined}>
      {children.split(" ").map((word, i) => (
        <span key={i} data-w style={{ color: from }}>
          {i > 0 ? " " : ""}
          {word}
        </span>
      ))}
    </Tag>
  );
}
