"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useThemeAt } from "../motion/useChapterTheme";
import styles from "./Cursor.module.css";

type Config = "default" | "clickable" | "draggable" | "dragging";

/** Ring cursor that trails the pointer and changes shape over links and draggable areas. */
export function Cursor() {
  const el = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<Config>("default");
  const [visible, setVisible] = useState(false);
  const pointer = useRef({ x: -100, y: -100, down: false });
  const probe = useCallback(() => pointer.current.y, []);
  const theme = useThemeAt(probe);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const pos = { x: -100, y: -100 };
    let raf = 0;
    const tick = () => {
      pos.x += (pointer.current.x - pos.x) * 0.2;
      pos.y += (pointer.current.y - pos.y) * 0.2;
      if (el.current) el.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const target = (t: EventTarget | null): Config => {
      const node = t instanceof Element ? t.closest<HTMLElement>("[data-cursor], a, button") : null;
      const v = node?.dataset.cursor;
      if (v === "draggable" || v === "clickable") return pointer.current.down && v === "draggable" ? "dragging" : v;
      return node ? "clickable" : "default";
    };
    const move = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      setVisible(true);
      setConfig(target(e.target));
    };
    const down = (e: PointerEvent) => {
      pointer.current.down = true;
      setConfig(target(e.target));
    };
    const up = (e: PointerEvent) => {
      pointer.current.down = false;
      setConfig(target(e.target));
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div ref={el} className={`${styles.cursor} ${visible ? styles.visible : ""}`} data-config={config} data-theme={theme} aria-hidden="true">
      <div className={styles.inner}>
        <div className={styles.circle} />
        <div className={styles.middle} />
        <div className={`${styles.dots} ${styles.dotsLeft}`} />
        <div className={`${styles.dots} ${styles.dotsRight}`} />
      </div>
    </div>
  );
}
