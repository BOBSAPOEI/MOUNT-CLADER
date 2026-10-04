import * as THREE from "three";
import { Assets } from "../core/Assets";
import type { Mouse } from "../core/Tools";
import { GLOBAL } from "../globals";
import { MouseComputationMaterial } from "../materials/core";

/** Ping-pong render target accumulating a trailing blob under the pointer. */
export class MouseComputation {
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly mesh: THREE.Mesh<THREE.BufferGeometry, MouseComputationMaterial>;
  private readonly rt1: THREE.WebGLRenderTarget;
  private readonly rt2: THREE.WebGLRenderTarget;
  private readonly realVelocity = new THREE.Vector2();
  private frame = 0;

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly mouse: Mouse, size = new THREE.Vector2(512, 512)) {
    const geometry = new THREE.BufferGeometry()
      .setAttribute("position", new THREE.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3))
      .setAttribute("uv", new THREE.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
    const material = new MouseComputationMaterial({
      uniforms: {
        tLast: { value: null },
        uMouse: { value: mouse.coordinates.webgl.clone() },
        uMouseVelocity: { value: new THREE.Vector2() },
        tNoise: { value: Assets.get("noise") },
        uTime: GLOBAL.uTime,
      },
      dithering: true,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.rt1 = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.FloatType });
    this.rt2 = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.FloatType });
  }

  update(dt: number) {
    const u = this.mesh.material.uniforms;
    const mouse = u.uMouse.value as THREE.Vector2;
    const target = this.mouse.coordinates.webgl;
    this.realVelocity.subVectors(target, mouse);
    (u.uMouseVelocity.value as THREE.Vector2).lerp(this.realVelocity, dt * 2);
    mouse.lerp(target, dt * 3);
    const previous = this.renderer.getRenderTarget();
    if (this.frame++ % 2 === 0) {
      this.renderer.setRenderTarget(this.rt1);
      u.tLast.value = this.rt2.texture;
    } else {
      this.renderer.setRenderTarget(this.rt2);
      u.tLast.value = this.rt1.texture;
    }
    this.renderer.clear();
    this.renderer.render(this.mesh, this.camera);
    this.renderer.setRenderTarget(previous);
  }

  get texture() {
    return this.rt1.texture;
  }

  dispose() {
    this.rt1.dispose();
    this.rt2.dispose();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
