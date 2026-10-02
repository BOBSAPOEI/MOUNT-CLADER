"use client";

import { useEffect, useRef } from "react";
import { Engine } from "../engine/Engine";
import type { PageKey } from "../engine/globals";
import type { Page } from "../engine/pages/Page";

/** Lazily imports the page class so each route only ships its own chapters. */
const PAGE_LOADERS: Partial<Record<PageKey, () => Promise<new () => Page>>> = {
  Trading: () => import("../engine/pages/Trading").then((m) => m.TradingPage),
  Capital: () => import("../engine/pages/Capital").then((m) => m.CapitalPage),
  Maritime: () => import("../engine/pages/Maritime").then((m) => m.MaritimePage),
  FortEnergy: () => import("../engine/pages/FortEnergy").then((m) => m.FortEnergyPage),
};

/** Fixed WebGL backdrop driven by the ported engine (`#canvas-wrapper`, as on the original). */
export function DivisionScene({ page }: { page: PageKey }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!wrapper.current || !canvas.current) return;
    let engine: Engine | null = null;
    let cancelled = false;
    try {
      engine = new Engine(wrapper.current, canvas.current);
    } catch {
      return;
    }
    const load = PAGE_LOADERS[page];
    if (load) {
      void load().then((PageClass) => {
        if (!cancelled) void engine!.init(() => new PageClass());
      });
    }
    return () => {
      cancelled = true;
      engine?.dispose();
    };
  }, [page]);

  return (
    <div id="canvas-wrapper" ref={wrapper} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  );
}
