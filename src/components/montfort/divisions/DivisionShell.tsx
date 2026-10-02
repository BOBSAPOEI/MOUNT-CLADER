"use client";

import { type ReactNode, useEffect } from "react";
import type { PageKey } from "../engine/globals";
import { Footer } from "../layout/Footer";
import { SiteChrome } from "../layout/SiteChrome";
import { attachAnimations } from "./animations";
import { initChaptersNavigation } from "./chaptersNavigation";
import { DivisionScene } from "./DivisionScene";
import "@/styles/montfort/divisions.css";

const SCOPE: Partial<Record<PageKey, string>> = {
  Trading: "data-mf-trading",
  Capital: "data-mf-capital",
  Maritime: "data-mf-maritime",
  FortEnergy: "data-mf-fort-energy",
};

/**
 * Layout of a division page: WebGL backdrop, persistent chrome, the page's `<main data-scene>` (whose
 * `[data-chapter]` blocks drive the 3D chapters) and the footer. DOM animations attach once mounted.
 */
export function DivisionShell({ page, active, children }: { page: PageKey; active: number; children: ReactNode }) {
  useEffect(() => {
    const main = document.querySelector("main[data-division]");
    const detachAnimations = attachAnimations(main ?? document);
    const detachNavigation = initChaptersNavigation();
    return () => {
      detachNavigation();
      detachAnimations();
    };
  }, []);

  const scope = SCOPE[page];
  return (
    <>
      <DivisionScene page={page} />
      <SiteChrome active={active} theme="light" />
      <main data-scene={page} data-division="" data-chapter-theme="light" {...(scope ? { [scope]: "" } : {})}>
        {children}
      </main>
      <Footer />
    </>
  );
}
