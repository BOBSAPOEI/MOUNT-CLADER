import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

export interface AssetEntry {
  path: string;
  pathMobile?: string;
  ktx2?: boolean;
}

export interface Manifest {
  textures?: Record<string, AssetEntry>;
  envMaps?: Record<string, AssetEntry>;
  models?: Record<string, AssetEntry>;
}

/** Everything lives under /montfort in this project (the original served it from /assets). */
export const ASSET_ROOT = "/montfort";
const url = (p: string) => p.replace(/^\/assets\//, `${ASSET_ROOT}/`);

type Loaded = THREE.Texture | THREE.Object3D;

const textureLoader = new THREE.TextureLoader();
const exrLoader = new EXRLoader();
const gltfLoader = new GLTFLoader();
let ktx2: KTX2Loader | null = null;

/**
 * Loads a manifest (textures, EXR env maps, glTF scenes) into one cache shared by every manager, so
 * `get("noise")` works from any chapter once the global manifest has loaded.
 */
export class Assets {
  static readonly loaded = new Map<string, Loaded>();

  constructor(
    readonly key: string,
    private readonly manifest: Manifest,
    private readonly options: { isMobile: boolean; renderer: THREE.WebGLRenderer },
  ) {}

  async load() {
    const jobs: Promise<unknown>[] = [];
    const { textures = {}, envMaps = {}, models = {} } = this.manifest;
    for (const [name, entry] of Object.entries(textures)) jobs.push(this.loadOne(name, entry, "texture"));
    for (const [name, entry] of Object.entries(envMaps)) jobs.push(this.loadOne(name, entry, "env"));
    for (const [name, entry] of Object.entries(models)) jobs.push(this.loadOne(name, entry, "model"));
    await Promise.all(jobs);
  }

  private async loadOne(name: string, entry: AssetEntry, kind: "texture" | "env" | "model") {
    if (Assets.loaded.has(name)) return Assets.loaded.get(name);
    const path = url(this.options.isMobile && entry.pathMobile ? entry.pathMobile : entry.path);
    try {
      let asset: Loaded;
      if (kind === "texture") asset = await textureLoader.loadAsync(path);
      else if (kind === "env") asset = await exrLoader.loadAsync(path);
      else {
        if (entry.ktx2 && !ktx2) {
          ktx2 = new KTX2Loader().setTranscoderPath("/vendor/basis/").detectSupport(this.options.renderer);
          gltfLoader.setKTX2Loader(ktx2);
        }
        const gltf = await gltfLoader.loadAsync(path);
        asset = gltf.scene;
        if (gltf.animations?.length) asset.animations = gltf.animations;
      }
      asset.userData = { ...(asset.userData || {}), path, loaderKey: kind };
      Assets.loaded.set(name, asset);
      return asset;
    } catch (e) {
      console.error(`[montfort] failed to load ${path}`, e);
      return undefined;
    }
  }

  get<T extends Loaded = THREE.Object3D>(name: string): T {
    return Assets.loaded.get(name) as T;
  }

  static get<T extends Loaded = THREE.Object3D>(name: string): T {
    return Assets.loaded.get(name) as T;
  }

  /** Drops everything (the engine is torn down with the page). */
  static disposeAll() {
    Assets.loaded.forEach((a) => {
      if ((a as THREE.Texture).isTexture) (a as THREE.Texture).dispose();
    });
    Assets.loaded.clear();
  }
}
