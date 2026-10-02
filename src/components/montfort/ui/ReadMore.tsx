"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./ReadMore.module.css";

interface ReadMoreProps {
  /** Number of lines shown while collapsed. */
  lines: number;
  tone?: "secondary" | "grey";
  /** Typography/colour classes applied to the clamped text wrapper. */
  textClassName?: string;
  children: ReactNode;
}

/** Text clamped to N lines with a round chevron button that animates the height open and closed. */
export function ReadMore({ lines, tone = "secondary", textClassName = "", children }: ReadMoreProps) {
  const content = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [expandable, setExpandable] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const measure = useCallback(() => {
    const el = inner.current;
    if (!el || expanded) return;
    setExpandable(el.scrollHeight - el.clientHeight > 2);
  }, [expanded]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const toggle = () => {
    const wrap = content.current;
    const text = inner.current;
    if (!wrap || !text) return;
    if (!expanded) {
      const from = wrap.offsetHeight;
      wrap.style.height = `${from}px`;
      text.classList.remove(styles.clamp);
      const to = text.scrollHeight;
      requestAnimationFrame(() => {
        wrap.style.height = `${to}px`;
      });
      setExpanded(true);
    } else {
      const from = wrap.offsetHeight;
      wrap.style.height = `${from}px`;
      text.classList.add(styles.clamp);
      const to = text.clientHeight;
      requestAnimationFrame(() => {
        wrap.style.height = `${to}px`;
      });
      setExpanded(false);
    }
  };

  return (
    <div
      className={`${styles.root} ${expandable ? styles.expandable : ""} ${expanded ? styles.expanded : ""} ${styles[tone]}`}
      style={{ "--line-count": lines } as CSSProperties}
    >
      <div ref={content} className={styles.content}>
        <div ref={inner} className={`${styles.clamp} ${textClassName}`}>
          {children}
        </div>
      </div>
      <button className={styles.button} onClick={toggle} aria-label="Expand text button" aria-expanded={expanded} data-cursor="clickable">
        <div className={styles.arrow} aria-hidden="true" />
      </button>
    </div>
  );
}
