"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ASSET } from "@/lib/montfort/content";
import { ScrollTopIcon } from "../ui/icons";
import { useThemeAt } from "../motion/useChapterTheme";
import styles from "./SideButtons.module.css";

const probe = (vh: number) => vh - 100;

/** Fixed scroll-to-top and ambient-sound buttons in the bottom-right corner. */
export function SideButtons() {
  const theme = useThemeAt(probe);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const level = useRef(0);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tiny waveform: flat while muted, gently oscillating while the ambient track plays.
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 24 * dpr;
    c.height = 24 * dpr;
    ctx.scale(dpr, dpr);
    let raf = 0;
    const draw = (t: number) => {
      const target = audio.current && !audio.current.paused ? 1 : 0;
      level.current += (target - level.current) * 0.08;
      ctx.clearRect(0, 0, 24, 24);
      ctx.strokeStyle = getComputedStyle(c).color;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = 2; x <= 22; x += 1) {
        const k = Math.sin((x / 22) * Math.PI);
        const y = 12 + Math.sin(x * 0.9 + t / 180) * 5 * k * level.current;
        if (x === 2) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggleSound = useCallback(() => {
    if (!audio.current) {
      audio.current = new Audio(`${ASSET}/sounds/sound.mp3`);
      audio.current.loop = true;
      audio.current.volume = 0.5;
    }
    if (audio.current.paused) {
      void audio.current.play();
      setPlaying(true);
    } else {
      audio.current.pause();
      setPlaying(false);
    }
  }, []);

  return (
    <div className={styles.container} data-theme={theme}>
      <div className={styles.wrapper}>
        <div className={styles.inner}>
          <button className={`${styles.button} ${styles.top} ${visible ? styles.visible : ""}`} onClick={() => window.dispatchEvent(new Event("mf:scroll-top"))} aria-label="Scroll to top" data-cursor="clickable">
            <ScrollTopIcon />
          </button>
          <button className={`${styles.button} ${styles.sound}`} onClick={toggleSound} aria-label={playing ? "Mute sound" : "Play sound"} aria-pressed={playing} data-cursor="clickable">
            <canvas ref={canvas} />
          </button>
        </div>
      </div>
    </div>
  );
}
