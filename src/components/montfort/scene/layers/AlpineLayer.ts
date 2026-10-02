import * as THREE from "three";
import { rawMap, SUN, type SceneContext, type SceneLayer, type Uniforms } from "../core";
import type { Frame } from "../timeline";
import { CLOUD_BANK_FRAG, CLOUD_VERT, MOUNTAIN_FRAG, MOUNTAIN_VERT, PEAK_FRAG, PEAK_VERT } from "../shaders/alpine";

/** Hero → what-we-do: the snowy mountain, three smaller peaks and the cloud decks around them. */
export class AlpineLayer implements SceneLayer {
  private mountain?: THREE.Mesh;
  private peaks?: THREE.Object3D;
  private readonly banks: THREE.Object3D[] = [];

  async load(ctx: SceneContext) {
    const [mountains, homepage] = await Promise.all([ctx.gltf.loadAsync(ctx.model("mountains.glb")), ctx.gltf.loadAsync(ctx.model("homepage/Homepage.glb"))]);
    if (ctx.isDisposed()) return;
    this.setupMountains(ctx, mountains.scene);
    this.setupPeaks(ctx, homepage.scene);
    // The cloud sea the camera dives through lives in a separate model; it can arrive a little later.
    void ctx.gltf.loadAsync(ctx.model("homepage/TopChapters.glb")).then((g) => {
      if (ctx.isDisposed()) return;
      g.scene.updateMatrixWorld(true);
      const sea = g.scene.getObjectByName("CloudSea") as THREE.Object3D | undefined;
      if (!sea) return;
      (sea as THREE.Mesh).material = this.bankMaterial(ctx, [6, 2], 0.8, 0.92);
      this.banks.push(sea);
      ctx.main.attach(sea);
    });
  }

  private bankMaterial(ctx: SceneContext, tile: [number, number], edge: number, opacity: number) {
    const s = ctx.shared;
    return new THREE.ShaderMaterial({
      vertexShader: CLOUD_VERT,
      fragmentShader: CLOUD_BANK_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        tNoise: s.tNoise,
        tPerlin: s.tPerlin,
        uTime: s.uTime,
        uChapter: s.uChapter,
        uResolution: s.uResolution,
        uLight: s.uLight,
        uDark: s.uDark,
        uTile: { value: new THREE.Vector2(tile[0], tile[1]) },
        uEdge: { value: edge },
        uOpacity: { value: opacity },
      },
    });
  }

  private hazeUniforms(): Uniforms {
    return {
      uSun: { value: SUN.clone() },
      uHaze: { value: new THREE.Color("#dfe6ec") },
      uShadow: { value: new THREE.Vector3(0.42, 0.54, 0.68) },
      uCloud: { value: new THREE.Color("#f1f5f8") },
      uFogLow: { value: 0 },
      uFogHigh: { value: 26 },
      uHazeNear: { value: 160 },
      uHazeFar: { value: 640 },
      uOpacity: { value: 1 },
    };
  }

  private setupMountains(ctx: SceneContext, root: THREE.Object3D) {
    root.updateMatrixWorld(true);
    const mountain = root.getObjectByName("Mountain") as THREE.Mesh | undefined;
    if (mountain) {
      mountain.material = new THREE.ShaderMaterial({
        vertexShader: MOUNTAIN_VERT,
        fragmentShader: MOUNTAIN_FRAG,
        uniforms: { ...this.hazeUniforms(), tRockNormal: { value: ctx.texture("textures/rock_normal.webp") }, tNoise: ctx.shared.tNoise, uDetail: { value: 1.6 }, uScale: { value: 0.045 } },
      });
      this.mountain = mountain;
      ctx.main.add(mountain);
    }
    const middle = root.getObjectByName("Middleground") as THREE.InstancedMesh | undefined;
    const front = root.getObjectByName("Foreground") as THREE.InstancedMesh | undefined;
    if (middle) {
      middle.material = this.bankMaterial(ctx, [5, 3], 0.8, 0.96);
      middle.renderOrder = -1;
      this.banks.push(middle);
      ctx.main.add(middle);
    }
    if (front) {
      front.material = this.bankMaterial(ctx, [5, 3], 0.84, 0.98);
      front.renderOrder = 1;
      this.banks.push(front);
      ctx.main.add(front);
    }
  }

  private setupPeaks(ctx: SceneContext, root: THREE.Object3D) {
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = new THREE.ShaderMaterial({
        vertexShader: PEAK_VERT,
        fragmentShader: PEAK_FRAG,
        side: THREE.DoubleSide,
        uniforms: { ...this.hazeUniforms(), uFogLow: { value: 16 }, uFogHigh: { value: 42 }, tMap: { value: rawMap(mesh.material) } },
      });
    });
    this.peaks = root;
    ctx.main.add(root);
  }

  update(frame: Frame) {
    const c = frame.chapter;
    if (this.mountain) this.mountain.visible = c < 3.3;
    if (this.peaks) this.peaks.visible = c < 3.3;
    this.banks.forEach((b) => (b.visible = c < 3.4));
  }
}
