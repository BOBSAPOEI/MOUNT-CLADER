import * as THREE from "three";
import { engine } from "../Engine";
import { Assets } from "../core/Assets";
import { GLOBAL, VIEWPORT } from "../globals";
import * as BoatHomepageShaders from "../shaders/BoatHomepage";
import * as EarthShaders from "../shaders/Earth";
import * as EarthGlowShaders from "../shaders/EarthGlow";
import * as GovernanceBackgroundShaders from "../shaders/GovernanceBackground";
import * as HomepageCloudsShaders from "../shaders/HomepageClouds";
import * as HomepagePeaksShaders from "../shaders/HomepagePeaks";
import { injectChunks } from "./chunks";
import type { MountainMaterial } from "./core";
import { PBRMaterial } from "./PBRMaterial";

type GltfMaterial = THREE.MeshStandardMaterial & Record<string, unknown>;

const mouseTexture = () => engine().mouseComputation?.texture ?? null;

/** Snowy peaks around the homepage mountain: PBR with the rock normals, sharing the mountain's fog range. */
export class HomepagePeaksMaterial extends PBRMaterial {
  constructor(params: GltfMaterial, caller: THREE.Object3D | null) {
    const mountain = engine().mainScene.mountains.mountainMaterial as MountainMaterial;
    params.normalMap = mountain.uniforms.tRockNormal.value as THREE.Texture;
    params.envMapRotation.set(0, -3, 0);
    super(params, caller);
    this.get<THREE.Vector2>("normalScale").set(1, 1);
    const normal = this.transform("normalMap");
    normal.repeat.set(3, 5);
    normal.update();
    this.set("envMapIntensity", 0.44);
    this.set("ambientIntensity", 2.24);
    this.set("ambient", new THREE.Color(0xc1d5d5));
    const u = this.uniforms;
    u.uFogNear = mountain.uniforms.uFogNear;
    u.uFogFar = mountain.uniforms.uFogFar;
    u.tNoise = { value: Assets.get("noise") };
    u.tPerlin = { value: Assets.get("perlinNoise") };
    u.tMouse = { value: mouseTexture() };
    this.transparent = true;
    u.uChapter = GLOBAL.uChapter;
    u.uTime = GLOBAL.uTime;
    u.uResolution = VIEWPORT.uResolution;
    u.uTransition = GLOBAL.uTransition;
    u.uTransitionColor = GLOBAL.uTransitionColor;
    u.uLightColor = GLOBAL.uLightColor;
    this.fragmentShader = injectChunks(HomepagePeaksShaders.fragmentChunks, this.fragmentShader);
    this.vertexShader = injectChunks(HomepagePeaksShaders.vertexChunks, this.vertexShader);
  }

  bindMouse() {
    this.uniforms.tMouse = { value: mouseTexture() };
  }
}

/** Sparse cloud wisps drifting past the camera in the homepage top chapters. */
export class HomepageCloudsMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uResolution: VIEWPORT.uResolution,
        uTime: GLOBAL.uTime,
        uChapter: GLOBAL.uChapter,
        tNoise: { value: Assets.get("noise") },
        tPerlin: { value: Assets.get("perlinNoise") },
      },
      depthTest: false,
      transparent: true,
    });
    const noise = this.uniforms.tNoise.value as THREE.Texture;
    noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    this.uniforms.tMouse = { value: mouseTexture() };
    this.vertexShader = HomepageCloudsShaders.vertexShader;
    this.fragmentShader = HomepageCloudsShaders.fragmentShader;
  }
}

/** Cargo ship crossing the storm in "What we do". */
export class BoatHomepageMaterial extends THREE.ShaderMaterial {
  constructor(params: GltfMaterial) {
    super({
      uniforms: {
        tMap: { value: params.map },
        tNoise: { value: Assets.get("noise") },
        uMobile: VIEWPORT.uMobile,
        uTime: GLOBAL.uTime,
        uChapter: GLOBAL.uChapter,
      },
      transparent: true,
    });
    this.vertexShader = BoatHomepageShaders.vertexShader;
    this.fragmentShader = BoatHomepageShaders.fragmentShader;
  }
}

/** Painted forest cards of the sustainability chapters. */
export class GovernanceBackgroundMaterial extends THREE.ShaderMaterial {
  constructor(params: GltfMaterial) {
    super({
      uniforms: {
        uTime: GLOBAL.uTime,
        uChapter: GLOBAL.uChapter,
        tMap: { value: params.map },
        tNoise: { value: Assets.get("noise") },
      },
      transparent: true,
    });
    this.vertexShader = GovernanceBackgroundShaders.vertexShader;
    this.fragmentShader = GovernanceBackgroundShaders.fragmentShader;
  }
}

/** Globe surface (land / sea data texture, clouds, specular), drawn through the secondary camera. */
export class EarthMaterial extends THREE.ShaderMaterial {
  constructor(params: THREE.ShaderMaterialParameters = {}) {
    super(params);
    this.vertexShader = EarthShaders.vertexShader;
    this.fragmentShader = EarthShaders.fragmentShader;
  }
}

/** Atmosphere rim around the globe. */
export class EarthGlowMaterial extends THREE.ShaderMaterial {
  constructor(params: THREE.ShaderMaterialParameters = {}) {
    super(params);
    this.vertexShader = EarthGlowShaders.vertexShader;
    this.fragmentShader = EarthGlowShaders.fragmentShader;
  }
}
