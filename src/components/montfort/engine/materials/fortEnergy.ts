import * as THREE from "three";
import { engine } from "../Engine";
import { Assets } from "../core/Assets";
import { GLOBAL, VIEWPORT } from "../globals";
import * as EnergyBgShaders from "../shaders/EnergyBg";
import * as EnergyConeShaders from "../shaders/EnergyCone";
import * as GlowShaders from "../shaders/Glow";
import * as HologramsShaders from "../shaders/Holograms";
import * as LineShaders from "../shaders/Line";
import * as PowerLineShaders from "../shaders/PowerLine";

/** Dark horizon backdrop of the Fort Energy hero. */
export class EnergyBgMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: GLOBAL.uTime,
        uTransition: GLOBAL.uTransition,
        uTransitionDirection: GLOBAL.uTransitionDirection,
        uLightColor: GLOBAL.uLightColor,
        uDarkColor: GLOBAL.uDarkColor,
        tNoise: { value: Assets.get("noise") },
      },
      depthTest: false,
      transparent: true,
    });
    this.vertexShader = EnergyBgShaders.vertexShader;
    this.fragmentShader = EnergyBgShaders.fragmentShader;
  }
}

/** Streaks of light running up the energy cone / cylinder. */
export class EnergyConeMaterial extends THREE.ShaderMaterial {
  constructor() {
    const noise = engine().noise.texture;
    super({
      uniforms: {
        uTime: GLOBAL.uTime,
        uTransition: GLOBAL.uTransition,
        uTransitionDirection: GLOBAL.uTransitionDirection,
        uDPR: VIEWPORT.uDPR,
        uChapter: GLOBAL.uChapter,
        uResolution: VIEWPORT.uResolution,
        tNoise: { value: noise },
        tMouseComputation: { value: engine().mouseComputation?.texture ?? null },
        uColor: { value: new THREE.Color(0xa1d2ff) },
        iSteps: { value: 8 },
        uSpeed: { value: 0.08 },
        uHeadLength: { value: 0.16 },
        uLineCount: { value: 60 },
        uOpacity: { value: 1 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });
    noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    this.vertexShader = EnergyConeShaders.vertexShader;
    this.fragmentShader = EnergyConeShaders.fragmentShader;
  }
}

export class PowerLineMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uResolution: VIEWPORT.uResolution,
        uTime: GLOBAL.uTime,
        uTransition: GLOBAL.uTransition,
        uTransitionDirection: GLOBAL.uTransitionDirection,
        uChapter: GLOBAL.uChapter,
        uLightColor: { value: new THREE.Color(0xa1d2ff) },
        tNoise: { value: Assets.get("noise") },
      },
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });
    this.vertexShader = PowerLineShaders.vertexShader;
    this.fragmentShader = PowerLineShaders.fragmentShader;
  }
}

export class GlowMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: { uTime: GLOBAL.uTime, uTransition: GLOBAL.uTransition, uLightColor: GLOBAL.uLightColor, uDarkColor: GLOBAL.uDarkColor },
      depthTest: false,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    this.vertexShader = GlowShaders.vertexShader;
    this.fragmentShader = GlowShaders.fragmentShader;
  }
}

/** X-ray hologram of the refinery / tanker / storage tanks (Fort Energy chapter). */
export class HologramsMaterial extends THREE.ShaderMaterial {
  constructor(params: THREE.MeshBasicMaterial, caller: THREE.Object3D) {
    super({
      uniforms: {
        tMap: { value: params.map },
        tMouse: { value: engine().mouseComputation?.texture ?? null },
        tNoise: { value: Assets.get("noise") },
        uMobile: VIEWPORT.uMobile,
        uResolution: VIEWPORT.uResolution,
        uDpr: VIEWPORT.uDPR,
        uTime: GLOBAL.uTime,
        uColor: { value: new THREE.Color("#8fc1e5") },
        uGlowColor: { value: new THREE.Color("#6BFEFF") },
        uFade: { value: 0 },
        uOffset: { value: 0 },
      },
      transparent: true,
      depthTest: false,
    });
    caller.renderOrder = Infinity;
    this.name = params.name;
    this.vertexShader = HologramsShaders.vertexShader;
    this.fragmentShader = HologramsShaders.fragmentShader;
  }
}

export class LineMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({ uniforms: { uTime: GLOBAL.uTime, uColor: { value: new THREE.Color("#84d5ff") }, uFade: { value: 0 } }, transparent: true });
    this.vertexShader = LineShaders.vertexShader;
    this.fragmentShader = LineShaders.fragmentShader;
  }
}
