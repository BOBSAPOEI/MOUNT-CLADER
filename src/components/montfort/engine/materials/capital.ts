import * as THREE from "three";
import { engine } from "../Engine";
import { Assets } from "../core/Assets";
import { GLOBAL, VIEWPORT } from "../globals";
import * as CapitalBackgroundShaders from "../shaders/CapitalBackground";
import * as CapitalForegroundShaders from "../shaders/CapitalForeground";
import * as GrassGroundShaders from "../shaders/GrassGround";
import * as GrassPlantsShaders from "../shaders/GrassPlants";
import { injectChunks } from "./chunks";
import { repeatTexture } from "./core";
import { PBRMaterial } from "./PBRMaterial";

type GltfMaterial = THREE.MeshStandardMaterial & Record<string, unknown>;

/** Capital prairie: PBR ground with grass, voronoi breakup and the lake reflection. */
export class CapitalForegroundMaterial extends PBRMaterial {
  readonly needsGrass = true;

  constructor(params: GltfMaterial, caller: THREE.Object3D | null) {
    super(params, caller);
    this.set("envMapIntensity", 1);
    const u = this.uniforms;
    u.uChapter = GLOBAL.uChapter;
    u.uTransition = GLOBAL.uTransition;
    u.uResolution = VIEWPORT.uResolution;
    u.uTime = GLOBAL.uTime;
    u.uTransitionColor = GLOBAL.uTransitionColor;
    u.uDarkColor = GLOBAL.uDarkColor;
    u.uLightColor = GLOBAL.uLightColor;
    u.uCapitalFog = GLOBAL.uCapitalFog;
    u.tVoronoi = { value: repeatTexture("voronoi") };
    u.tNoise = { value: Assets.get("noise") };
    u.tGrass = { value: null };
    u.tReflexion = { value: null };
    u.textureMatrix = { value: null };
    this.transparent = true;
    this.fragmentShader = injectChunks(CapitalForegroundShaders.fragmentChunks, this.fragmentShader);
    this.vertexShader = injectChunks(CapitalForegroundShaders.vertexChunks, this.vertexShader);
  }
}

/** Painted mountain backdrop of the Capital valley, tinted towards the sun and fog. */
export class CapitalBackgroundMaterial extends THREE.ShaderMaterial {
  constructor(params: GltfMaterial) {
    super();
    this.transparent = true;
    const flares = engine().mainScene.flares.material as THREE.ShaderMaterial;
    this.uniforms.uSunProjected = flares.uniforms.uSunProjected;
    this.uniforms.tMap = { value: params.map };
    this.uniforms.uResolution = VIEWPORT.uResolution;
    this.uniforms.uTime = GLOBAL.uTime;
    this.uniforms.uTransition = GLOBAL.uTransition;
    this.uniforms.uTransitionColor = GLOBAL.uTransitionColor;
    this.uniforms.uLightColor = GLOBAL.uLightColor;
    this.uniforms.uDarkColor = GLOBAL.uDarkColor;
    this.uniforms.uCapitalFog = GLOBAL.uCapitalFog;
    this.uniforms.tNoise = { value: Assets.get("noise") };
    this.fragmentShader = CapitalBackgroundShaders.fragmentShader;
    this.vertexShader = CapitalBackgroundShaders.vertexShader;
  }
}

/** Ground of the grass close-up (Capital chapter). */
export class GrassGroundMaterial extends THREE.RawShaderMaterial {
  constructor(light: THREE.Vector3, mesh: THREE.Mesh) {
    const source = mesh.material as THREE.MeshStandardMaterial;
    const map = source.map!;
    const height = source.aoMap!;
    map.colorSpace = THREE.LinearSRGBColorSpace;
    engine().renderer.initTexture(map);
    engine().renderer.initTexture(height);
    super({
      uniforms: {
        uMap: { value: map },
        uNoise: { value: Assets.get("noise") },
        uHeight: { value: height },
        uLight: { value: light },
        uWind: { value: 1 },
        uTime: GLOBAL.uTime,
        uChapter: GLOBAL.uChapter,
        uRatio: VIEWPORT.uRatio,
        uResolution: VIEWPORT.uResolution,
        uScrollProgress: GLOBAL.uScrollProgress,
        tMouseComputation: { value: engine().mouseComputation?.texture ?? null },
      },
      transparent: true,
      depthTest: false,
    });
    const noise = this.uniforms.uNoise.value as THREE.Texture;
    noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    this.vertexShader = GrassGroundShaders.vertexShader;
    this.fragmentShader = GrassGroundShaders.fragmentShader;
  }
}

/** Instanced flowers / grass blades swaying in the wind (Capital chapter). */
export class GrassPlantsMaterial extends THREE.RawShaderMaterial {
  constructor(light: THREE.Vector3, mesh: THREE.Mesh) {
    const map = (mesh.material as THREE.MeshStandardMaterial).map;
    super({
      uniforms: {
        uMap: { value: map },
        uLight: { value: light },
        uWind: { value: 1 },
        uTime: GLOBAL.uTime,
        uChapter: GLOBAL.uChapter,
        uMouse: { value: engine().lerpedMouse },
        uResolution: VIEWPORT.uResolution,
        uScrollProgress: GLOBAL.uScrollProgress,
        tMouseComputation: { value: engine().mouseComputation?.texture ?? null },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
    });
    this.vertexShader = GrassPlantsShaders.vertexShader;
    this.fragmentShader = GrassPlantsShaders.fragmentShader;
    mesh.renderOrder = 20;
  }
}
