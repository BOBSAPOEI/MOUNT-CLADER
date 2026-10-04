"use client";

import { useEffect, useRef } from "react";
import { ScrollDownIcon, LogoDesktop, LogoMobile } from "../ui/icons";
import styles from "./Hero.module.css";

/** Opening screen: the Calder logo over the mountain scene and a scroll prompt. */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  // Give every logo path its own delay so the mark assembles dot by dot.
  useEffect(() => {
    root.current?.querySelectorAll<SVGElement>("svg > *").forEach((path, i, all) => {
      const order = i < all.length / 2 ? i : i - all.length / 2;
      path.style.setProperty("--i", String(order));
    });
  }, []);

  return (
    <section ref={root} id="Hero" className={`hero ${styles.hero}`} data-chapter="Hero" data-chapter-first="true" data-chapter-theme="dark">
      <div className={styles.inner}>
        <LogoMobile className={styles.logoMobile} />
        <LogoDesktop className={styles.logoDesktop} />
        <div className={styles.cta}>
          <div className={styles.ctaMobile}>
            <ScrollDownIcon />
            <span className="fs-cta-s">Swipe down</span>
          </div>
          <div className={styles.ctaDesktop}>
            <span className="fs-cta-s">Scroll down to discover</span>
          </div>
        </div>
      </div>
    </section>
  );
}
