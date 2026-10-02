import * as THREE from "three";
import { rawMap, SUN, type SceneContext, type SceneLayer, type Uniforms } from "../core";
import { smoothstep, type Frame } from "../timeline";
import { CLOUD_BANK_FRAG, CLOUD_VERT, MOUNTAIN_FRAG, MOUNTAIN_VERT, PEAK_FRAG, PEAK_VERT } from "../shaders/alpine";

/**
 * Per-peak atmosphere, matched to the original's opening frame: the foreground ridge on the left is
 * mostly lost in cloud, the peak at the bottom right stands clear of it, the far one is hazed by distance.
 */
const PEAK_LOOK: Record<string, { fogLow: number; fogHigh: number; veil: number; hazeFar: number; overClouds: boolean }> = {
  HomepagePeaks: { fogLow: 16, fogHigh: 40, veil: 0.6, hazeFar: 640, overClouds: false },
  HomepagePeaks002: { fogLow: -12, fogHigh: 4, veil: 0, hazeFar: 640, overClouds: true },
  HomepagePeaksBG: { fogLow: -40, fogHigh: -20, veil: 0.15, hazeFar: 1500, overClouds: false },
};

/** Hero → what-we-do: the snowy mountain, three smaller peaks and the cloud decks around them. */
export class AlpineLayer implements SceneLayer {
  private mountain?: THREE.Mesh;
  private peaks?: THREE.Object3D;
  private readonly banks: THREE.Object3D[] = [];
  /** Materials of the peaks layered over the cloud decks (faded out once the camera enters them). */
  private readonly overCloud: THREE.ShaderMaterial[] = [];

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
      // The decks are layered over the scenery rather than depth-sorted against it: in the opening
      // frame they swallow the mountain's base even where its slopes are nearer than the bank.
      depthTest: false,
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
      uCloud: { value: new THREE.Color("#eaf2f8") },
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
        uniforms: {
          ...this.hazeUniforms(),
          tLightmap: { value: ctx.texture("textures/homepage/homepage-lightmap.webp") },
          tRockNormal: { value: ctx.texture("textures/rock_normal.webp") },
          tRockDiffuse: { value: ctx.texture("textures/rock_diffuse.webp") },
          tNoise: ctx.shared.tNoise,
          uFogLow: { value: -34 },
          uFogHigh: { value: 2 },
          uLit: { value: new THREE.Color("#f2f8fb") },
          uShade: { value: new THREE.Color("#c0d3e0") },
          uDetail: { value: 1.4 },
          uScale: { value: 0.085 },
        },
      });
      this.mountain = mountain;
      ctx.main.add(mountain);
    }
    const middle = root.getObjectByName("Middleground") as THREE.InstancedMesh | undefined;
    const front = root.getObjectByName("Foreground") as THREE.InstancedMesh | undefined;
    if (middle) {
      middle.material = this.bankMaterial(ctx, [5, 3], 0.88, 1);
      middle.renderOrder = -1;
      this.banks.push(middle);
      ctx.main.add(middle);
    }
    if (front) {
      front.material = this.bankMaterial(ctx, [5, 3], 0.9, 1);
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
      const look = PEAK_LOOK[mesh.name] ?? PEAK_LOOK.HomepagePeaks002;
      mesh.material = new THREE.ShaderMaterial({
        vertexShader: PEAK_VERT,
        fragmentShader: PEAK_FRAG,
        side: THREE.DoubleSide,
        // Peaks standing in front of the cloud decks are drawn after them.
        transparent: look.overClouds,
        uniforms: {
          ...this.hazeUniforms(),
          uFogLow: { value: look.fogLow },
          uFogHigh: { value: look.fogHigh },
          uVeil: { value: look.veil },
          uHazeFar: { value: look.hazeFar },
          uBaseFade: { value: look.overClouds ? 1 : 0 },
          tMap: { value: rawMap(mesh.material) },
        },
      });
      if (look.overClouds) {
        mesh.renderOrder = 5;
        this.overCloud.push(mesh.material as THREE.ShaderMaterial);
      }
    });
    this.peaks = root;
    ctx.main.add(root);
  }

  update(frame: Frame) {
    const c = frame.chapter;
    // Once the camera has dived through the cloud deck into the storm, the summits above it would
    // only show as flat cloud-white silhouettes, so they are dropped.
    if (this.mountain) this.mountain.visible = c < 2.3;
    if (this.peaks) this.peaks.visible = c < 2.3;
    // As the camera sinks into the decks the clouds close over the peaks layered in front of them.
    const clear = 1 - smoothstep(0.5, 1.05, c);
    this.overCloud.forEach((m) => (m.uniforms.uOpacity.value = clear));
    this.banks.forEach((b) => (b.visible = c < 2.6));
  }
}
