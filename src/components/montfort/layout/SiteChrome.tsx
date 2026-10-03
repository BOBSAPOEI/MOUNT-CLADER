"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { PAGES } from "../engine/globals";
import { pageKeyFromPath } from "../engine/pages";
import { SmoothScroll } from "../motion/SmoothScroll";
import { Cursor } from "./Cursor";
import { Header } from "./Header";
import { Menu } from "./Menu";
import { SideButtons } from "./SideButtons";

/**
 * Fixed UI that persists across pages (rendered once by the root layout): smooth scroll, header, menu overlay,
 * side buttons and cursor. The current page comes from the route; division pages use white ink ("light"),
 * as the original sets it from the path, while the homepage follows the chapter under the header.
 */
export function SiteChrome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useCallback(() => setMenuOpen((o) => !o), []);
  const close = useCallback(() => setMenuOpen(false), []);
  const key = pageKeyFromPath(usePathname());
  const active = key ? PAGES.indexOf(key) : -1;
  const theme = key && key !== "Homepage" ? "light" : undefined;

  return (
    <>
      <SmoothScroll locked={menuOpen} />
      <Cursor />
      <Header menuOpen={menuOpen} onToggleMenu={toggle} active={active} theme={theme} />
      <Menu open={menuOpen} active={active} onNavigate={close} />
      <SideButtons theme={theme} />
    </>
  );
}
