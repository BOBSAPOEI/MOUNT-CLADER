import * as THREE from "three";

/** Page keys in camera-rail order: the camera sits at `index / 4` along the mountains' camera path. */
export const PAGES = ["Homepage", "Trading", "Capital", "Maritime", "FortEnergy"] as const;
export type PageKey = (typeof PAGES)[number];

/** Uniforms shared by every material (same objects, so updating `.value` updates all of them). */
export const GLOBAL = {
  uTime: { value: 0 },
  uPage: { value: 0 },
  uSlideshowProgress: { value: 0 },
  uTransition: { value: 0 },
  uHeroTransition: { value: 0 },
  uLongpress: { value: 0 },
  uTransitionDirection: { value: 0 },
  uTransitionColor: { value: new THREE.Color(0xdbd9d4) },
  uScrollProgress: { value: 0 },
  uChapter: { value: 0 },
  uAbsScrollProgress: { value: 0 },
  uDarkColor: { value: new THREE.Color(0x000000) },
  uLightColor: { value: new THREE.Color(0xffffff) },
  uCapitalFog: { value: new THREE.Color(0x868340) },
};

/** Viewport uniforms (resolution is in drawing-buffer pixels). */
export const VIEWPORT = {
  uRatio: { value: 1 },
  uDPR: { value: 1 },
  uResolution: { value: new THREE.Vector2() },
  uMobile: { value: 0 },
};

/** Light / dark colour pair of each page (drives sky, fog and most materials). */
export const PAGE_COLORS: Record<PageKey, [THREE.Color, THREE.Color]> = {
  Homepage: [new THREE.Color(0xe8ecef), new THREE.Color(0x5c7283)],
  Trading: [new THREE.Color("#8597af"), new THREE.Color("#3c4e5f")],
  Capital: [new THREE.Color("#e2e2d7"), new THREE.Color("#4fc3df")],
  Maritime: [new THREE.Color(0xe2e3df), new THREE.Color("#6e92b8")],
  FortEnergy: [new THREE.Color(0x3e9bb7), new THREE.Color(0x081219)],
};

export const BREAKPOINTS = { tablet: 768, desktop: 1024 };

/** Render layer of the mountain (reflectors re-render only this layer). */
export const LAYER_MOUNTAIN = 1;

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const mapRange = (v: number, a: number, b: number, c: number, d: number) => c + ((v - a) * (d - c)) / (b - a);
export const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;
/** Frame-rate independent lerp. */
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));
