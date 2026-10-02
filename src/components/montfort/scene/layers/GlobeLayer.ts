import * as THREE from "three";
import { rawMap, SUN, type SceneContext, type SceneLayer } from "../core";
import { smoothstep, type Frame } from "../timeline";
import { GLOBE_FRAG, GLOBE_VERT, GLOW_FRAG } from "../shaders/globe";

/** Globe chapter: earth sphere and atmosphere glow, drawn in their own pass with the telephoto globe camera. */
export class GlobeLayer implements SceneLayer {
  private group?: THREE.Group;
  private materials: THREE.ShaderMaterial[] = [];
  private visible = false;

  async load(ctx: SceneContext) {
    const g = await ctx.gltf.loadAsync(ctx.model("homepage/earth-min.glb"));
    if (ctx.isDisposed()) return;
    let map: THREE.Texture | null = null;
    g.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) map = rawMap(mesh.material) ?? map;
    });
    if (!map) return;

    const geometry = new THREE.SphereGeometry(10, 96, 96);
    // Transparent so `uOpacity` blends the earth over the sky; an opaque pass would write the fade
    // into the canvas alpha and let the page background wash the globe out.
    const earthMat = new THREE.ShaderMaterial({
      vertexShader: GLOBE_VERT,
      fragmentShader: GLOBE_FRAG,
      transparent: true,
      uniforms: {
        tData: { value: map },
        tNoise: ctx.shared.tNoise,
        uTime: ctx.shared.uTime,
        uSunV: { value: SUN.clone().normalize() },
        uSea: { value: new THREE.Color("#082233") },
        uAmbient: { value: new THREE.Color("#085069") },
        uLand: { value: new THREE.Color("#2a3f52") },
        uRim: { value: new THREE.Color("#8f9c9f") },
        uOpacity: { value: 1 },
      },
    });
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: GLOBE_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { uGlow: { value: new THREE.Color("#f4f6fb") }, uOpacity: { value: 1 } },
    });
    const earth = new THREE.Mesh(geometry, earthMat);
    const glow = new THREE.Mesh(geometry, glowMat);
    glow.scale.setScalar(1.02);
    earth.renderOrder = 0;
    glow.renderOrder = 1;
    this.group = new THREE.Group();
    this.group.add(earth, glow);
    this.materials = [earthMat, glowMat];
    ctx.globe.add(this.group);
  }

  update(frame: Frame) {
    const c = frame.chapter;
    const alpha = smoothstep(2.92, 3.2, c) * (1 - smoothstep(4.04, 4.16, c));
    this.visible = !!this.group && alpha > 0.001;
    if (!this.group) return;
    this.group.visible = this.visible;
    if (!this.visible) return;
    const e = frame.earth;
    this.group.position.set(e.x, e.y, e.z);
    this.group.rotation.y = e.rotation;
    this.materials.forEach((m) => (m.uniforms.uOpacity.value = alpha));
  }

  needsGlobePass() {
    return this.visible;
  }
}
