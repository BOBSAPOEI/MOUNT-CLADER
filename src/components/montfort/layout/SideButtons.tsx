"use client";

import { useEffect, useState } from "react";
import { ScrollTopIcon } from "../ui/icons";
import { type Theme, useThemeAt } from "../motion/useChapterTheme";
import styles from "./SideButtons.module.css";

const probe = (vh: number) => vh - 100;

/**
 * Fixed scroll-to-top button in the bottom-right corner. Its ink follows the page theme (division pages pass
 * theirs; the homepage follows the chapter under the button).
 */
export function SideButtons({ theme: pageTheme }: { theme?: Theme } = {}) {
  const probedTheme = useThemeAt(probe);
  const theme = pageTheme ?? probedTheme;
  const [visible, setVisible] = useState(false);
  const [overFooter, setOverFooter] = useState(false);

  useEffect(() => {
    // The arrow appears past the first screen and fades out once the footer starts entering the viewport.
    const onScroll = () => {
      const footer = document.querySelector("footer");
      setVisible(window.scrollY > window.innerHeight);
      setOverFooter(!!footer && footer.getBoundingClientRect().top < window.innerHeight);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`${styles.container} ${overFooter ? styles.faded : ""}`} data-theme={theme}>
      <div className={styles.wrapper}>
        <div className={styles.inner}>
          <button className={`${styles.button} ${styles.top} ${visible ? styles.visible : ""}`} onClick={() => window.dispatchEvent(new Event("mf:scroll-top"))} aria-label="Scroll to top" data-cursor="clickable">
            <ScrollTopIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
