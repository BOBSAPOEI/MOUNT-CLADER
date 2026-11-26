import * as THREE from "three";
import { engine } from "../Engine";
import { Assets } from "../core/Assets";
import { GLOBAL, VIEWPORT } from "../globals";
import * as BoatMaritimeShaders from "../shaders/BoatMaritime";
import * as DiffuseCloudShaders from "../shaders/DiffuseCloud";
import * as SeaShaders from "../shaders/Sea";
import * as SeaRockShaders from "../shaders/SeaRock";
import * as WaterShaders from "../shaders/Water";
import { injectChunks } from "./chunks";
import type { MountainMaterial } from "./core";
import { repeatTexture } from "./core";
import { PBRMaterial } from "./PBRMaterial";

type GltfMaterial = THREE.MeshStandardMaterial & Record<string, unknown>;

/** Open sea around the Maritime island (also the reflector surface). */
export class SeaMaterial extends THREE.ShaderMaterial {
  constructor(params: GltfMaterial) {
    super();
    const u = this.uniforms;
    u.uWaterColor = { value: new THREE.Color("#045984") };
    u.tMap = { value: params.map };
    u.tNoiseNormal = { value: repeatTexture("waterNormal") };
    u.uTransition = GLOBAL.uTransition;
    u.uChapter = GLOBAL.uChapter;
    u.uResolution = VIEWPORT.uResolution;
    u.uTime = GLOBAL.uTime;
    u.uTransitionColor = GLOBAL.uTransitionColor;
    u.uLightColor = GLOBAL.uLightColor;
    u.tNoise = { value: Assets.get("noise") };
    u.tPerlin = { value: engine().noise.texture };
    u.tMouse = { value: engine().mouseComputation?.texture ?? null };
    this.transparent = true;
    this.fragmentShader = SeaShaders.fragmentShader;
    this.vertexShader = SeaShaders.vertexShader;
  }
}

/** Rocks scattered around the island: PBR with rock normals, sharing the mountain fog range. */
export class SeaRockMaterial extends PBRMaterial {
  constructor(params: GltfMaterial, caller: THREE.Object3D | null) {
    params.normalMap = Assets.get<THREE.Texture>("rockNormal");
    super(params, caller);
    const mountain = engine().mainScene.mountains.mountainMaterial as MountainMaterial;
    this.uniforms.uFogNear = mountain.uniforms.uFogNear;
    this.uniforms.uFogFar = mountain.uniforms.uFogFar;
    const normal = this.transform("normalMap");
    normal.repeat.set(10, 10);
    normal.update();
    this.transparent = true;
    this.uniforms.tPerlin = { value: repeatTexture("perlinNoise") };
    this.uniforms.tNoise = { value: repeatTexture("noise") };
    this.uniforms.uTime = GLOBAL.uTime;
    this.uniforms.uTransition = GLOBAL.uTransition;
    this.uniforms.uTransitionColor = GLOBAL.uTransitionColor;
    this.uniforms.uLightColor = GLOBAL.uLightColor;
    this.fragmentShader = injectChunks(SeaRockShaders.fragmentChunks, this.fragmentShader);
    this.vertexShader = injectChunks(SeaRockShaders.vertexChunks, this.vertexShader);
  }
}

/** Soft camera-facing cloud cards drifting over the sea. */
export class DiffuseCloudMaterial extends THREE.ShaderMaterial {
  constructor(_params: GltfMaterial, caller: THREE.Object3D) {
    super();
    caller.renderOrder = caller.userData.renderOrder as number;
    this.uniforms = {
      uCameraRotation: { value: new THREE.Matrix3() },
      uSize: { value: new THREE.Vector2(1, 1) },
      uChapter: GLOBAL.uChapter,
      uTime: GLOBAL.uTime,
      uResolution: VIEWPORT.uResolution,
      uTransition: GLOBAL.uTransition,
      uPage: GLOBAL.uPage,
      uRatio: VIEWPORT.uRatio,
      uLightColor: GLOBAL.uLightColor,
      uDarkColor: GLOBAL.uDarkColor,
      tPerlin: { value: Assets.get("perlinNoise") },
      tNoise: { value: repeatTexture("noise") },
      tMouse: { value: engine().mouseComputation?.texture ?? null },
    };
    this.depthWrite = false;
    this.depthTest = false;
    this.side = THREE.FrontSide;
    this.transparent = true;
    this.vertexShader = DiffuseCloudShaders.vertexShader;
    this.fragmentShader = DiffuseCloudShaders.fragmentShader;
  }
}

/** Tanker sprite of the Maritime chapter, darkened as the chapter progresses. */
export class BoatMaritimeMaterial extends THREE.ShaderMaterial {
  constructor(params: THREE.MeshBasicMaterial) {
    super({ uniforms: { tMap: { value: params.map }, uChapter: GLOBAL.uChapter }, transparent: true });
    this.vertexShader = BoatMaritimeShaders.vertexShader;
    this.fragmentShader = BoatMaritimeShaders.fragmentShader;
  }
}

/** Wake of the tanker. */
export class WaterMaterial extends THREE.ShaderMaterial {
  constructor(params: THREE.ShaderMaterialParameters = {}) {
    super(params);
    this.vertexShader = WaterShaders.vertexShader;
    this.fragmentShader = WaterShaders.fragmentShader;
  }
}
