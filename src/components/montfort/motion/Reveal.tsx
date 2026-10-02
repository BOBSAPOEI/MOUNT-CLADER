"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import styles from "./Reveal.module.css";

interface RevealProps {
  as?: ElementType;
  variant?: "fade" | "line";
  /** Seconds to wait after the element enters the viewport. */
  delay?: number;
  className?: string;
  children?: ReactNode;
}

/** Fades (or draws) an element in the first time it enters the viewport. */
export function Reveal({ as: Tag = "div", variant = "fade", delay = 0, className = "", children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`${styles[variant]} ${inView ? styles.in : ""} ${className}`} style={{ "--delay": `${delay}s` } as CSSProperties}>
      {children}
    </Tag>
  );
}
