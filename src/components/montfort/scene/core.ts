import * as THREE from "three";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Frame } from "./timeline";

export type Uniforms = Record<string, THREE.IUniform>;

/** Light direction shared by every lit layer (also the globe's sun, in its camera space). */
export const SUN = new THREE.Vector3(-100, 200, 150);

/** Palette taken from the brand's light haze, storm slate, globe backdrop and night navy. */
export const PALETTE = {
  light: new THREE.Color("#e8ecef"),
  dark: new THREE.Color("#5c7283"),
  globeBg: new THREE.Color("#5b6d7d"),
  night: new THREE.Color("#09192a"),
};

/**
 * Everything a layer needs to build itself. Uniforms in `shared` (tNoise, tPerlin, uTime, uChapter,
 * uResolution, uLight, uDark) are updated once per frame by the engine and can be referenced directly.
 */
export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  /** Main scene, seen through the rail camera. */
  main: THREE.Scene;
  /** Globe scene, seen through the fixed telephoto globe camera. */
  globe: THREE.Scene;
  /** Full-screen backdrop scene (orthographic). */
  sky: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  globeCamera: THREE.PerspectiveCamera;
  gltf: GLTFLoader;
  shared: Uniforms;
  /** Loads (once) a texture from public/montfort, sampled raw with repeat wrapping. */
  texture(path: string): THREE.Texture;
  /** URL of a model in public/montfort/models. */
  model(path: string): string;
  isDisposed(): boolean;
}

/** One chapter's worth of scenery. Layers own their objects, materials and per-frame logic. */
export interface SceneLayer {
  load(ctx: SceneContext): Promise<void> | void;
  update(frame: Frame, time: number): void;
  resize?(width: number, height: number, aspect: number): void;
  /** Whether the globe pass needs to be drawn this frame (only the globe layer sets this). */
  needsGlobePass?(): boolean;
}

/** GLTF textures are re-flagged as raw so custom shaders read display-space values. */
export function rawMap(material: THREE.Material | THREE.Material[]): THREE.Texture | null {
  const m = (Array.isArray(material) ? material[0] : material) as THREE.MeshStandardMaterial;
  const map = m?.map ?? null;
  if (map) map.colorSpace = THREE.NoColorSpace;
  return map;
}
