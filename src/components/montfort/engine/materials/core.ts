import * as THREE from "three";
import { engine } from "../Engine";
import { Assets } from "../core/Assets";
import { GLOBAL, VIEWPORT } from "../globals";
import * as CloudShaders from "../shaders/Cloud";
import * as FlaresShaders from "../shaders/Flares";
import * as LakeShaders from "../shaders/Lake";
import * as MaritimeSimpleShaders from "../shaders/MaritimeSimple";
import * as MountainShaders from "../shaders/Mountain";
import * as MouseShaders from "../shaders/MouseComputation";
import * as ParticlesShaders from "../shaders/Particles";
import * as SkyShaders from "../shaders/Sky";
import * as TransitionCloudsShaders from "../shaders/TransitionClouds";
import * as TransitionLinesShaders from "../shaders/TransitionLines";
import { CONFIG_TYPES_MAPPING, PBRMaterial, PROPS_WITH_UV } from "./PBRMaterial";

type GltfMaterial = THREE.MeshStandardMaterial & Record<string, unknown>;

/** Shared global texture with repeat wrapping (the original sets wrapping on the shared instance). */
export function repeatTexture(name: string) {
  const t = Assets.get<THREE.Texture>(name);
  if (t) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const mouseTexture = () => engine().mouseComputation?.texture ?? null;

/** Config applied per page to the shared mountain material. */
export interface MountainConfig {
  envMapIntensity: number;
  envMapRotation: THREE.Euler;
  ambient: THREE.Color;
  ambientIntensity: number;
  roughness: number;
  color: THREE.Color;
  armMap: THREE.Texture;
  map: THREE.Texture;
  mapTransformRepeat: THREE.Vector2;
  mapTransformOffset: THREE.Vector2;
  mapTransformRotation: number;
  map2: THREE.Texture;
  map2TransformRepeat: THREE.Vector2;
  map2TransformOffset: THREE.Vector2;
  map2TransformRotation: number;
  mixMap?: THREE.Texture;
  fogNear: number;
  fogFar: number;
}

/** The shared mountain landscape: PBR lighting plus snow / rock / grass blending, fog and per-page looks. */
export class MountainMaterial extends PBRMaterial {
  constructor(params: GltfMaterial, caller: THREE.Object3D | null) {
    super(params, caller, { roughness: 1, normalScale: new THREE.Vector2(1, 1), map2: null, mixMap: null, fogNear: 0.001, fogFar: 100 }, CONFIG_TYPES_MAPPING, [...PROPS_WITH_UV, "map2"]);
    this.blending = THREE.CustomBlending;
    const u = this.uniforms;
    u.tRockNormal = { value: repeatTexture("rockNormal") };
    u.uResolution = VIEWPORT.uResolution;
    u.uTransition = GLOBAL.uTransition;
    u.uHeroTransition = GLOBAL.uHeroTransition;
    u.uTransitionDirection = GLOBAL.uTransitionDirection;
    u.uChapter = GLOBAL.uChapter;
    u.uPage = GLOBAL.uPage;
    u.uTime = GLOBAL.uTime;
    u.uTransitionColor = GLOBAL.uTransitionColor;
    u.uDarkColor = GLOBAL.uDarkColor;
    u.uLightColor = GLOBAL.uLightColor;
    u.uCapitalFog = GLOBAL.uCapitalFog;
    u.tNoise = { value: repeatTexture("noise") };
    const random = engine().noise.nearestTexture;
    random.wrapS = random.wrapT = THREE.RepeatWrapping;
    u.tRandom = { value: random };
    u.tPerlin = { value: repeatTexture("perlinNoise") };
    u.tNoiseNormal = { value: repeatTexture("noiseNormal") };
    u.tVoronoi = { value: repeatTexture("voronoi") };
    u.tMouse = { value: mouseTexture() };
    this.defines.SIXTY_MAP_UV = "uv";
    this.defines.SIXTY_NORMALMAP_UV = "uv";
    this.defines.SIXTY_ARMMAP_UV = "uv";
    this.fragmentShader = MountainShaders.fragmentShader;
    this.vertexShader = MountainShaders.vertexShader;
  }

  /** Called on attach, once the mouse trail texture exists. */
  bindMouse() {
    this.uniforms.tMouse = { value: mouseTexture() };
  }

  applyConfig(config: MountainConfig) {
    this.params = { ...this.params, ...config };
    this.applyParams(Object.fromEntries(Object.entries(this.params).filter(([k]) => k in this.defaultsParams)));
    const map = this.transform("map");
    map.repeat.copy(config.mapTransformRepeat);
    map.offset.copy(config.mapTransformOffset);
    map.rotation = config.mapTransformRotation;
    map.update();
    const map2 = this.transform("map2");
    map2.repeat.copy(config.map2TransformRepeat);
    map2.offset.copy(config.map2TransformOffset);
    map2.rotation = config.map2TransformRotation;
    map2.update();
  }
}

/** Full-screen-ish sky cylinder that follows the camera. */
export class SkyMaterial extends THREE.ShaderMaterial {
  constructor(_params: unknown, private readonly caller: THREE.Mesh) {
    super();
    this.uniforms = {
      uLightColor: GLOBAL.uLightColor,
      uDarkColor: GLOBAL.uDarkColor,
      uTransitionColor: GLOBAL.uTransitionColor,
      uScrollProgress: GLOBAL.uScrollProgress,
      uChapter: GLOBAL.uChapter,
      uTransition: GLOBAL.uTransition,
      uTransitionDirection: GLOBAL.uTransitionDirection,
      uTime: GLOBAL.uTime,
      uPage: GLOBAL.uPage,
      uResolution: VIEWPORT.uResolution,
      tNoise: { value: repeatTexture("noise") },
      tNearestNoise: { value: engine().noise.nearestTexture },
      tMouse: { value: mouseTexture() },
    };
    caller.frustumCulled = false;
    caller.renderOrder = -10;
    this.vertexShader = SkyShaders.vertexShader;
    this.fragmentShader = SkyShaders.fragmentShader;
  }

  bindMouse() {
    this.uniforms.tMouse = { value: mouseTexture() };
  }

  onBeforeRender(_r: THREE.WebGLRenderer, _s: THREE.Scene, camera: THREE.Camera) {
    this.caller.matrixWorld.copyPosition(camera.matrixWorld);
  }
}

/** Lens flare of the Capital sun (screen-space quad). */
export class FlaresMaterial extends THREE.ShaderMaterial {
  private readonly projected = new THREE.Vector3();
  constructor(private readonly sun: THREE.Object3D) {
    super({
      uniforms: {
        uRatio: VIEWPORT.uRatio,
        uChapter: GLOBAL.uChapter,
        uTransition: GLOBAL.uTransition,
        uTransitionColor: GLOBAL.uTransitionColor,
        uPage: GLOBAL.uPage,
        tNoise: { value: Assets.get("noise") },
      },
      dithering: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.uniforms.uSunProjected = { value: this.projected };
    this.vertexShader = FlaresShaders.vertexShader;
    this.fragmentShader = FlaresShaders.fragmentShader;
  }

  /** Projects the sun every tick. */
  update(camera: THREE.Camera) {
    camera.updateMatrixWorld();
    this.projected.copy(this.sun.position).project(camera);
  }
}

/** Homepage cloud cards (hidden on the division pages, but built with the shared scene). */
export class CloudMaterial extends THREE.ShaderMaterial {
  constructor(_params: unknown, caller: THREE.Object3D) {
    super();
    caller.renderOrder = (caller.userData.renderOrder as number) ?? caller.renderOrder;
    this.uniforms = {
      uSize: { value: new THREE.Vector2(1, 1) },
      uChapter: GLOBAL.uChapter,
      uTime: GLOBAL.uTime,
      uResolution: VIEWPORT.uResolution,
      uRatio: VIEWPORT.uRatio,
      uTransition: GLOBAL.uTransition,
      uPage: GLOBAL.uPage,
      uLightColor: GLOBAL.uLightColor,
      uDarkColor: GLOBAL.uDarkColor,
      tPerlin: { value: Assets.get("perlinNoise") },
      tNoise: { value: repeatTexture("noise") },
      tMouse: { value: mouseTexture() },
    };
    this.depthWrite = false;
    this.depthTest = false;
    this.side = THREE.FrontSide;
    this.transparent = true;
    this.vertexShader = CloudShaders.vertexShader;
    this.fragmentShader = CloudShaders.fragmentShader;
  }

  bindMouse() {
    this.uniforms.tMouse = { value: mouseTexture() };
  }
}

export class TransitionCloudsMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uRatio: VIEWPORT.uRatio,
        uTime: GLOBAL.uTime,
        uLongpress: GLOBAL.uLongpress,
        uTransition: GLOBAL.uTransition,
        uTransitionColor: GLOBAL.uTransitionColor,
        uCameraProgress: GLOBAL.uSlideshowProgress,
        uPage: GLOBAL.uPage,
        tNoise: { value: Assets.get("noise") },
        tMouse: { value: mouseTexture() },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.vertexShader = TransitionCloudsShaders.vertexShader;
    this.fragmentShader = TransitionCloudsShaders.fragmentShader;
  }

  bindMouse() {
    this.uniforms.tMouse = { value: mouseTexture() };
  }
}

export class TransitionLinesMaterial extends THREE.ShaderMaterial {
  constructor() {
    super();
    this.uniforms = { uTime: GLOBAL.uTime, uTransition: GLOBAL.uTransition, uRatio: VIEWPORT.uRatio };
    this.side = THREE.FrontSide;
    this.transparent = true;
    this.depthWrite = false;
    this.vertexShader = TransitionLinesShaders.vertexShader;
    this.fragmentShader = TransitionLinesShaders.fragmentShader;
  }
}

/** Ping-pong mouse trail used by the grid, water and wireframe shaders. */
export class MouseComputationMaterial extends THREE.ShaderMaterial {
  constructor(params: THREE.ShaderMaterialParameters) {
    super(params);
    this.vertexShader = MouseShaders.vertexShader;
    this.fragmentShader = MouseShaders.fragmentShader;
  }
}

/** Drifting dust points (Trading particles, homepage dust). */
export class ParticlesMaterial extends THREE.RawShaderMaterial {
  constructor(color: THREE.Color, size: number) {
    super({
      uniforms: {
        uPage: GLOBAL.uPage,
        uTransition: GLOBAL.uTransition,
        uDpr: VIEWPORT.uDPR,
        uResolution: VIEWPORT.uResolution,
        uChapter: GLOBAL.uChapter,
        uColor: { value: color },
        uTime: GLOBAL.uTime,
        uSize: { value: size },
        uOpacity: { value: 0.4 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      forceSinglePass: true,
    });
    this.vertexShader = ParticlesShaders.vertexShader;
    this.fragmentShader = ParticlesShaders.fragmentShader;
  }
}

/** Mountain material used inside the Maritime sea reflection (lightmap only). */
export class MaritimeSimpleMaterial extends THREE.ShaderMaterial {
  constructor(lightmap: THREE.Texture) {
    super({ uniforms: { tMap: { value: lightmap } } });
    this.vertexShader = MaritimeSimpleShaders.vertexShader;
    this.fragmentShader = MaritimeSimpleShaders.fragmentShader;
  }
}

/** Reflective lake / sea surface fed by a Reflector render target. */
export class LakeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super();
    this.transparent = true;
    this.depthTest = false;
    this.uniforms = {
      uTime: GLOBAL.uTime,
      uResolution: VIEWPORT.uResolution,
      uChapter: GLOBAL.uChapter,
      uTransition: GLOBAL.uTransition,
      uTransitionColor: GLOBAL.uTransitionColor,
      tDiffuse: { value: null },
      textureMatrix: { value: null },
      tNoiseNormal: { value: Assets.get("noiseNormal") },
      tNoise: { value: Assets.get("noise") },
      tMouse: { value: mouseTexture() },
    };
    this.vertexShader = LakeShaders.vertexShader;
    this.fragmentShader = LakeShaders.fragmentShader;
  }
}
