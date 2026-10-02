import type { PageKey } from "../globals";
import type { Page } from "./Page";

/** Page classes, imported on demand so a route only downloads the scenes it shows. */
export const PAGE_LOADERS: Record<PageKey, () => Promise<new () => Page>> = {
  Homepage: () => import("./Homepage").then((m) => m.HomepagePage),
  Trading: () => import("./Trading").then((m) => m.TradingPage),
  Capital: () => import("./Capital").then((m) => m.CapitalPage),
  Maritime: () => import("./Maritime").then((m) => m.MaritimePage),
  FortEnergy: () => import("./FortEnergy").then((m) => m.FortEnergyPage),
};

/** Route of each page (the original's `cn`), and the reverse lookup. */
export const PAGE_PATHS: Record<PageKey, string> = {
  Homepage: "/",
  Trading: "/trading",
  Capital: "/capital",
  Maritime: "/maritime",
  FortEnergy: "/fort-energy",
};

export function pageKeyFromPath(pathname: string): PageKey | null {
  let path = pathname.replace(/\/$/, "");
  if (path === "") path = "/";
  const entry = Object.entries(PAGE_PATHS).find(([, p]) => p === path);
  return entry ? (entry[0] as PageKey) : null;
}
