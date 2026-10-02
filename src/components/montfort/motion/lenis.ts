import type Lenis from "lenis";

let current: Lenis | null = null;

/** The page's Lenis instance (set by `SmoothScroll`), for code outside React such as the WebGL transitions. */
export const getLenis = () => current;

export function setLenis(lenis: Lenis | null) {
  current = lenis;
}
