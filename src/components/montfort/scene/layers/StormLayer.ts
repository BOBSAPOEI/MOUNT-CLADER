import * as THREE from "three";
import { rawMap, type SceneContext, type SceneLayer } from "../core";
import { smoothstep, type Frame } from "../timeline";
import { BOAT_FRAG, CLOUD_STREAK_FRAG, SPRITE_VERT, STREAK_VERT } from "../shaders/storm";

/** Divisions chapter: storm-cloud streak backdrop and the tanker sailing through the clouds. */
export class StormLayer implements SceneLayer {
  private streaks?: THREE.Object3D;
  private boat?: THREE.Object3D;
  private boatMaterial?: THREE.ShaderMaterial;

  async load(ctx: SceneContext) {
    const [top, boat] = await Promise.all([ctx.gltf.loadAsync(ctx.model("homepage/TopChapters.glb")), ctx.gltf.loadAsync(ctx.model("homepage/WhatWeDo.glb"))]);
    if (ctx.isDisposed()) return;
    top.scene.updateMatrixWorld(true);
    const sparse = top.scene.getObjectByName("SparseClouds") as THREE.Mesh | undefined;
    if (sparse) {
      sparse.material = new THREE.ShaderMaterial({
        vertexShader: STREAK_VERT,
        fragmentShader: CLOUD_STREAK_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          tNoise: ctx.shared.tNoise,
          tPerlin: ctx.shared.tPerlin,
          uTime: ctx.shared.uTime,
          uChapter: ctx.shared.uChapter,
          uLight: ctx.shared.uLight,
          uDark: ctx.shared.uDark,
          uOpacity: { value: 1 },
        },
      });
      this.streaks = sparse;
      ctx.main.add(sparse);
    }

    boat.scene.updateMatrixWorld(true);
    boat.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      this.boatMaterial = new THREE.ShaderMaterial({
        vertexShader: SPRITE_VERT,
        fragmentShader: BOAT_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { tMap: { value: rawMap(mesh.material) }, uOpacity: { value: 1 }, uTint: { value: new THREE.Color(1, 1, 1) } },
      });
      mesh.material = this.boatMaterial;
      mesh.renderOrder = 2;
    });
    this.boat = boat.scene;
    ctx.main.add(boat.scene);
  }

  update(frame: Frame, time: number) {
    const c = frame.chapter;
    if (this.streaks) this.streaks.visible = c > 1.9 && c < 3.2;
    if (this.boat && this.boatMaterial) {
      this.boat.visible = c > 2.0 && c < 3.05;
      const storm = smoothstep(2.3, 2.6, c) * (1 - smoothstep(2.8, 3.0, c));
      this.boatMaterial.uniforms.uOpacity.value = smoothstep(2.0, 2.3, c) * (1 - smoothstep(2.95, 3.05, c));
      const k = 1 - 0.18 * storm;
      (this.boatMaterial.uniforms.uTint.value as THREE.Color).setRGB(k, k * 1.01, k * 1.04);
      this.boat.position.y = Math.sin(time * 0.6) * 0.15;
    }
  }
}
