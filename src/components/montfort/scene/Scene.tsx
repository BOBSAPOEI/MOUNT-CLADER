"use client";

import { useEffect, useRef, useState } from "react";
import { MontfortScene } from "./MontfortScene";
import styles from "./Scene.module.css";

/** Fixed full-screen 3D backdrop. Falls back to a plain gradient when WebGL is unavailable. */
export function Scene() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let scene: MontfortScene;
    try {
      scene = new MontfortScene(el, () => setReady(true));
    } catch {
      return;
    }

    const measure = () => {
      const top = document.getElementById("TopChapters");
      const footer = document.getElementById("footer");
      const vh = window.innerHeight;
      scene.setMetrics({
        railLength: Math.max(1, (top?.offsetHeight ?? 0) - vh),
        footerTop: footer ? footer.getBoundingClientRect().top + window.scrollY : 1,
        viewportHeight: vh,
      });
    };
    const onResize = () => {
      scene.resize();
      measure();
    };
    measure();
    document.fonts?.ready.then(measure);
    const timer = window.setInterval(measure, 1500);
    window.addEventListener("resize", onResize);
    scene.start(() => window.scrollY);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", onResize);
      scene.dispose();
    };
  }, []);

  return <div id="canvas-wrapper" ref={host} className={`${styles.wrapper} ${ready ? styles.ready : ""}`} aria-hidden="true" />;
}
