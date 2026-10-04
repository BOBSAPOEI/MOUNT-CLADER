"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { CITIES } from "@/lib/montfort/content";
import { ScrubText } from "../motion/ScrubText";
import styles from "./GlobalConnectivity.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Globe chapter: headline over the 3D earth, with city labels tracked onto it by the scene. */
export function GlobalConnectivity() {
  const section = useRef<HTMLElement>(null);

  // As on the original: the city labels fade in as the chapter arrives and out at 60% of it, scrubbed.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const points = el.querySelectorAll("[data-point]");
    const tl = gsap.timeline();
    tl.fromTo(points, { opacity: 0 }, { opacity: 1, stagger: { amount: 0.1 }, duration: 0.1 }, 0);
    tl.to(points, { opacity: 0, stagger: { amount: 0.1 }, duration: 0.1 }, 0.6);
    tl.add(() => {}, 1);
    const st = ScrollTrigger.create({ trigger: el, scrub: true, animation: tl });
    return () => {
      st.kill();
      tl.revert().kill();
    };
  }, []);

  return (
    <section ref={section} id="GlobalConnectivity" data-chapter="GlobalConnectivity" data-chapter-theme="light" data-cursor="draggable" className={styles.section}>
      <div className="mf-grid">
        <ScrubText
          className="fs-h2 uppercase tb:col-end-4 dk:col-start-7 dk:col-end-22 wide:col-start-10"
          from="rgba(255,255,255,0.3)"
          to="#ffffff"
        >
          Established in the world’s major media and business hubs, we connect brands with audiences in both emerging and mature markets worldwide.
        </ScrubText>
      </div>
      {CITIES.map((c) => (
        <p key={c.name} className={`${styles.point} fs-cta-s uppercase`} data-point data-longitude={c.lon} data-latitude={c.lat}>
          <span>{c.name}</span>
        </p>
      ))}
    </section>
  );
}
