import * as THREE from "three";
import { rawMap, type SceneContext, type SceneLayer } from "../core";
import { smoothstep, type Frame } from "../timeline";
import { DUST_FRAG, DUST_VERT, FOREST_FRAG, FOREST_VERT } from "../shaders/forest";

const DUST_CENTER = new THREE.Vector3(460.2, -371.5, -221.5);

/** Sustainability chapters: blurred forest backdrop, tree silhouettes and drifting dust. */
export class ForestLayer implements SceneLayer {
  private readonly planes: THREE.Mesh[] = [];
  private dust?: THREE.Points;

  async load(ctx: SceneContext) {
    const g = await ctx.gltf.loadAsync(ctx.model("homepage/Sustainability-min.glb"));
    if (ctx.isDisposed()) return;
    g.scene.updateMatrixWorld(true);
    g.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const isBackground = mesh.name === "Forest-Background";
      mesh.material = new THREE.ShaderMaterial({
        vertexShader: FOREST_VERT,
        fragmentShader: FOREST_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          tMap: { value: rawMap(mesh.material) },
          uTime: ctx.shared.uTime,
          uOpacity: { value: 0 },
          uBlur: { value: isBackground ? 0.0035 : 0.0016 },
          uBrightness: { value: isBackground ? 0.62 : 0.5 },
          uTint: { value: new THREE.Color(0.9, 1, 1) },
        },
      });
      mesh.renderOrder = isBackground ? 0 : 1;
      this.planes.push(mesh);
    });
    ctx.main.add(g.scene);

    const count = 160;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(48 * Math.cbrt(Math.random()));
      positions.set([DUST_CENTER.x + v.x, DUST_CENTER.y + v.y, DUST_CENTER.z + v.z], i * 3);
      seeds[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    this.dust = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uSize: { value: 5 },
          uDpr: { value: ctx.renderer.getPixelRatio() },
          uTime: ctx.shared.uTime,
          uColor: { value: new THREE.Color("#b6fffb") },
          uOpacity: { value: 0 },
        },
      }),
    );
    this.dust.frustumCulled = false;
    ctx.main.add(this.dust);
  }

  update(frame: Frame) {
    const c = frame.chapter;
    const night = smoothstep(4.02, 4.5, c);
    this.planes.forEach((m) => {
      m.visible = c > 3.95;
      (m.material as THREE.ShaderMaterial).uniforms.uOpacity.value = night;
    });
    if (this.dust) {
      this.dust.visible = c > 3.95;
      (this.dust.material as THREE.ShaderMaterial).uniforms.uOpacity.value = smoothstep(4.1, 4.6, c) * 0.4;
    }
  }
}
