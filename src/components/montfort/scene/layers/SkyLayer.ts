import * as THREE from "three";
import { PALETTE, type SceneContext, type SceneLayer } from "../core";
import { SKY_FRAG, SKY_VERT } from "../shaders/sky";

/** Full-screen backdrop drawn first every frame. */
export class SkyLayer implements SceneLayer {
  private material?: THREE.ShaderMaterial;

  load(ctx: SceneContext) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tNoise: ctx.shared.tNoise,
        uChapter: ctx.shared.uChapter,
        uTime: ctx.shared.uTime,
        uAspect: { value: 1.6 },
        uLight: ctx.shared.uLight,
        uDark: ctx.shared.uDark,
        uGlobeBg: { value: PALETTE.globeBg },
        uNight: { value: PALETTE.night },
      },
    });
    ctx.sky.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
  }

  update() {}

  resize(_w: number, _h: number, aspect: number) {
    if (this.material) this.material.uniforms.uAspect.value = aspect;
  }
}
