"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { ambientSound } from "./ambientSound";

/**
 * Sound on/off button drawn as a tiny waveform: flat while muted, gently oscillating while the ambient track
 * plays. The line takes the button's text colour, so it follows the page theme. Style the canvas at 24px.
 */
export function SoundToggle({ className = "" }: { className?: string }) {
  const playing = useSyncExternalStore(ambientSound.subscribe, ambientSound.isPlaying, () => false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 24 * dpr;
    c.height = 24 * dpr;
    ctx.scale(dpr, dpr);
    let level = 0;
    let raf = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!c.offsetParent) return; // hidden at this screen size
      level += ((ambientSound.isPlaying() ? 1 : 0) - level) * 0.08;
      ctx.clearRect(0, 0, 24, 24);
      ctx.strokeStyle = getComputedStyle(c).color;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = 2; x <= 22; x += 1) {
        const k = Math.sin((x / 22) * Math.PI);
        const y = 12 + Math.sin(x * 0.9 + t / 180) * 5 * k * level;
        if (x === 2) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <button
      className={className}
      onClick={ambientSound.toggle}
      aria-label={playing ? "Mute sound" : "Play sound"}
      aria-pressed={playing}
      data-cursor="clickable"
      data-sound-toggle=""
    >
      <canvas ref={canvas} width={24} height={24} aria-hidden="true" />
    </button>
  );
}
