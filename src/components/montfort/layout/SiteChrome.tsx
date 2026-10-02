"use client";

import { useCallback, useState } from "react";
import { SmoothScroll } from "../motion/SmoothScroll";
import { Cursor } from "./Cursor";
import { Header } from "./Header";
import { Menu } from "./Menu";
import { SideButtons } from "./SideButtons";

/** Fixed UI that persists while scrolling: smooth scroll, header, menu overlay, side buttons and cursor. */
export function SiteChrome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useCallback(() => setMenuOpen((o) => !o), []);
  const close = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <SmoothScroll locked={menuOpen} />
      <Cursor />
      <Header menuOpen={menuOpen} onToggleMenu={toggle} />
      <Menu open={menuOpen} onNavigate={close} />
      <SideButtons />
    </>
  );
}
