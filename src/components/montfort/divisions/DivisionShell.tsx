"use client";

import { type ReactNode, useEffect } from "react";
import type { PageKey } from "../engine/globals";
import { Footer } from "../layout/Footer";
import { attachAnimations } from "./animations";
import { initChaptersNavigation } from "./chaptersNavigation";
import "@/styles/montfort/divisions.css";

const SCOPE: Partial<Record<PageKey, string>> = {
  Trading: "data-mf-trading",
  Capital: "data-mf-capital",
  Maritime: "data-mf-maritime",
  FortEnergy: "data-mf-fort-energy",
};

/**
 * Layout of a division page: the page's `<main data-scene>` (whose `[data-chapter]` blocks drive the 3D
 * chapters of the persistent WebGL layer) and the footer. DOM animations attach once mounted.
 */
export function DivisionShell({ page, children }: { page: PageKey; children: ReactNode }) {
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
      <main data-scene={page} data-division="" data-chapter-theme="light" {...(scope ? { [scope]: "" } : {})}>
        {children}
      </main>
      <Footer />
    </>
  );
}
