import * as THREE from "three";
import { engine } from "../Engine";
import { Assets } from "../core/Assets";
import { GLOBAL, VIEWPORT } from "../globals";
import * as GridShaders from "../shaders/Grid";
import * as HoverParticlesShaders from "../shaders/HoverParticles";
import * as WireframeShaders from "../shaders/Wireframe";

export class HoverParticlesMaterial extends THREE.ShaderMaterial {
  constructor(params: THREE.ShaderMaterialParameters = {}) {
    super(params);
    this.vertexShader = HoverParticlesShaders.vertexShader;
    this.fragmentShader = HoverParticlesShaders.fragmentShader;
  }
}

export class WireframeMaterial extends THREE.ShaderMaterial {
  constructor(params: THREE.ShaderMaterialParameters = {}) {
    super(params);
    this.vertexShader = WireframeShaders.vertexShader;
    this.fragmentShader = WireframeShaders.fragmentShader;
  }
}

export interface GridOptions {
  gridScale?: number;
  lineWidth?: number;
  crossSize?: number;
  pointSize?: number;
  speed?: number;
  backgroundNoise?: number;
  brightness?: number;
  backgroundColor?: THREE.Color;
  pointColor?: THREE.Color;
  accentColor?: THREE.Color;
  lineColor?: THREE.Color;
  depth?: number;
  /** Accepted for parity with the original call sites; unused by the shader. */
  infiniteMovement?: boolean;
}

/** Endless blueprint grid with dots, crosses and a mouse glow (Trading chapter, Fort Energy chapter). */
export class GridMaterial extends THREE.ShaderMaterial {
  constructor({
    gridScale = 100,
    lineWidth = 0.02,
    crossSize = 0.3,
    pointSize = 0.01,
    speed = 0,
    backgroundNoise = 0,
    brightness = 1,
    backgroundColor = new THREE.Color("#051723"),
    pointColor = new THREE.Color().setStyle("#1D7FC8", THREE.LinearSRGBColorSpace),
    accentColor = new THREE.Color().setStyle("#325977", THREE.LinearSRGBColorSpace),
    lineColor = new THREE.Color().setStyle("#0c222f", THREE.LinearSRGBColorSpace),
    depth = 1000,
  }: GridOptions = {}) {
    super({
      uniforms: {
        uTime: GLOBAL.uTime,
        uScrollProgress: GLOBAL.uScrollProgress,
        tMouseComputation: { value: engine().mouseComputation?.texture ?? null },
        uResolution: VIEWPORT.uResolution,
        uLineColor: { value: lineColor },
        uBackgroundColor: { value: backgroundColor },
        uAccentColor: { value: accentColor },
        uGridScale: { value: gridScale },
        uLineWidth: { value: lineWidth },
        uCrossSize: { value: crossSize },
        uPointSize: { value: pointSize },
        uPointColor: { value: pointColor },
        uBrightness: { value: brightness },
        uBackgroundNoise: { value: backgroundNoise },
        uSpeed: { value: speed },
        uDepth: { value: depth },
        uFade: { value: 1 },
        uTranslate: { value: new THREE.Vector2() },
        tNoise: { value: Assets.get("noise") },
      },
      depthTest: false,
      dithering: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    this.vertexShader = GridShaders.vertexShader;
    this.fragmentShader = GridShaders.fragmentShader;
  }
}
