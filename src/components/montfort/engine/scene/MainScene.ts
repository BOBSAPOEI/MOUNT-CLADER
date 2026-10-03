import * as THREE from "three";
import { GLOBAL, LAYER_MOUNTAIN } from "../globals";
import { FlaresMaterial, MountainMaterial, TransitionCloudsMaterial, TransitionLinesMaterial } from "../materials/core";
import { replaceMaterials } from "../materials/registry";

/** Holds the shared `Mountain` mesh; page envs are attached to it. */
export class Mountains extends THREE.Object3D {
  readonly mountain: THREE.Mesh;
  readonly mountainMaterial: MountainMaterial;

  constructor(root: THREE.Object3D) {
    super();
    this.mountain = root.getObjectByName("Mountain") as THREE.Mesh;
    this.mountain.layers.enable(LAYER_MOUNTAIN);
    this.mountainMaterial = this.mountain.material as MountainMaterial;
    this.mountain.renderOrder = 0;
    this.add(this.mountain);
  }
}

/** Vertical light streaks used by the page transition (one quad per `TransitionLines` empty). */
class TransitionLines extends THREE.Mesh {
  constructor(source: THREE.Object3D) {
    const position: number[] = [];
    const offset: number[] = [];
    const uv: number[] = [];
    const size = new THREE.Vector3(1, 40, 0);
    source.children.forEach((c) => {
      for (let i = 0; i < 6; i++) position.push(c.position.x, c.position.y + 80, c.position.z);
      offset.push(-size.x, -size.y, 0, size.x, size.y, 0, -size.x, size.y, 0, -size.x, -size.y, 0, size.x, -size.y, 0, size.x, size.y, 0);
      uv.push(0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(position), 3));
    geometry.setAttribute("offset", new THREE.BufferAttribute(new Float32Array(offset), 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uv), 2));
    super(geometry, new TransitionLinesMaterial());
    this.renderOrder = -10;
  }
}

export interface ScenePreset {
  cloudsVisible?: boolean;
  mountainsVisible?: boolean;
  seaVisible?: boolean;
  skyVisible?: boolean;
  flaresVisible?: boolean;
  env?: string;
}

const DEFAULT_PRESET: Required<Omit<ScenePreset, "env">> = { cloudsVisible: false, mountainsVisible: true, seaVisible: false, skyVisible: true, flaresVisible: false };
const quad = new THREE.PlaneGeometry(2, 2).deleteAttribute("normal");

/** The single scene every page renders into: mountain, sky, clouds, flares and transition layers. */
export class MainScene extends THREE.Scene {
  mountains!: Mountains;
  sun!: THREE.Object3D;
  sky!: THREE.Object3D;
  flares!: THREE.Mesh<THREE.BufferGeometry, FlaresMaterial>;
  transitionClouds!: THREE.Mesh;
  clouds!: THREE.Object3D;
  transitionLines!: TransitionLines;
  initialMountainsPosition = new THREE.Vector3();

  constructor() {
    super();
    this.background = new THREE.Color(0);
  }

  /** Builds the shared scenery once the global manifest (mountains.glb, env map) is loaded. */
  setup(renderer: THREE.WebGLRenderer, envMap: THREE.DataTexture, mountainsRoot: THREE.Object3D) {
    this.environment = createPMREM(renderer, envMap);
    this.sun = mountainsRoot.getObjectByName("CapitalSun")!;
    // Flares are referenced by materials created while swapping (CapitalBackground), so build them first.
    this.flares = new THREE.Mesh(quad, new FlaresMaterial(this.sun));
    this.flares.renderOrder = Infinity;
    this.flares.frustumCulled = false;
    replaceMaterials(mountainsRoot);
    this.mountains = new Mountains(mountainsRoot);
    this.initialMountainsPosition = this.mountains.position.clone();
    this.sky = mountainsRoot.getObjectByName("Skybox")!;
    this.transitionClouds = new THREE.Mesh(quad, new TransitionCloudsMaterial());
    this.transitionClouds.renderOrder = Infinity;
    this.transitionClouds.frustumCulled = false;
    this.clouds = mountainsRoot.getObjectByName("Clouds")!;
    this.transitionLines = new TransitionLines(mountainsRoot.getObjectByName("TransitionLines")!);
    this.add(this.mountains, this.flares, this.transitionClouds, this.transitionLines, this.sky, this.clouds);
  }

  applyPreset(preset: ScenePreset = {}, pageIndex?: number) {
    const p = { ...DEFAULT_PRESET, ...preset };
    this.mountains.visible = p.mountainsVisible;
    this.clouds.visible = p.cloudsVisible;
    this.sky.visible = p.skyVisible;
    this.flares.visible = p.flaresVisible;
    if (typeof pageIndex === "number") GLOBAL.uPage.value = pageIndex;
  }
}

/** Pre-filtered (PMREM) environment from the equirectangular EXR, as the PBR shaders expect. */
function createPMREM(renderer: THREE.WebGLRenderer, source: THREE.DataTexture) {
  source.mapping = THREE.EquirectangularReflectionMapping;
  const generator = new THREE.PMREMGenerator(renderer);
  generator.compileEquirectangularShader();
  const texture = generator.fromEquirectangular(source).texture;
  source.dispose();
  generator.dispose();
  return texture;
}
