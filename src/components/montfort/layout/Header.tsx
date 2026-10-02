"use client";

import { useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/montfort/content";
import { type Theme, useThemeAt } from "../motion/useChapterTheme";
import styles from "./Header.module.css";

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  /** Index of the current page in the division links (0 = Calder Group). */
  active?: number;
  /** Page-level ink colour; division pages use white ink ("light") like the original. */
  theme?: Theme;
}

const probe = () => 70;

/** Fixed top bar: division links with a sliding underline, news counter and menu toggle. */
export function Header({ menuOpen, onToggleMenu, active = 0, theme: pageTheme }: HeaderProps) {
  const probedTheme = useThemeAt(probe);
  const theme = pageTheme ?? probedTheme;
  const [hidden, setHidden] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const [bar, setBar] = useState({ left: 0, width: 0 });

  // Hide while scrolling down, show again when scrolling up (or near the top).
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 40) setHidden(false);
      else if (Math.abs(y - last) > 6) setHidden(y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const moveBar = (index: number) => {
    const ul = list.current;
    const a = ul?.querySelectorAll<HTMLAnchorElement>("a")[index];
    if (!ul || !a) return;
    const pad = parseFloat(getComputedStyle(a).paddingLeft);
    const padRight = parseFloat(getComputedStyle(a).paddingRight);
    setBar({ left: a.offsetLeft + pad, width: a.offsetWidth - pad - padRight });
  };

  useEffect(() => {
    const set = () => moveBar(active);
    set();
    document.fonts?.ready.then(set);
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, [active]);

  return (
    <header id="header" className={`${styles.header} ${hidden && !menuOpen ? styles.hidden : ""}`} data-theme={menuOpen ? "dark" : theme}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <div className={styles.links} onMouseLeave={() => moveBar(active)}>
            <ul ref={list}>
              {NAV.map((n, i) => (
                <li key={n.href}>
                  <a href={n.href} className={`${styles.link} ${i === active ? styles.active : ""}`} onMouseEnter={() => moveBar(i)} data-cursor="clickable">
                    {n.name}
                  </a>
                </li>
              ))}
            </ul>
            <div className={styles.navbar} style={{ left: bar.left, width: bar.width }} />
          </div>
          <div className={styles.right}>
            <a href="/news/" className={styles.news} data-cursor="clickable">
              <p>News</p>
              <div className={styles.counter}>
                <span>27</span>
              </div>
            </a>
            <button className={`${styles.menu} ${menuOpen ? styles.close : ""}`} onClick={onToggleMenu} aria-expanded={menuOpen} data-cursor="clickable">
              <p>
                <span>{menuOpen ? "Close" : "Menu"}</span>
                <span>{menuOpen ? "Close" : "Menu"}</span>
              </p>
              <div className={styles.dots} aria-hidden="true">
                <div className={styles.dot} />
                <div className={styles.dot} />
                <div className={styles.dot} />
                <div className={styles.dot} />
              </div>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
