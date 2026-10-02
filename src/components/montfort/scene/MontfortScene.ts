import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { ASSET } from "@/lib/montfort/content";
import { sampleFrame, smoothstep, type PageMetrics } from "./timeline";
import { COMMON_GLSL } from "./shaders/common";
import { SKY_FRAG, SKY_VERT } from "./shaders/sky";
import { CLOUD_BANK_FRAG, CLOUD_STREAK_FRAG, CLOUD_VERT } from "./shaders/cloud";
import { BOAT_FRAG, MOUNTAIN_FRAG, MOUNTAIN_VERT, PEAK_FRAG, PEAK_VERT, SPRITE_VERT } from "./shaders/terrain";
import { GLOBE_FRAG, GLOBE_VERT, GLOW_FRAG } from "./shaders/globe";
import { DUST_FRAG, DUST_VERT, FOREST_FRAG, FOREST_VERT } from "./shaders/forest";

void COMMON_GLSL;

const SUN = new THREE.Vector3(-100, 200, 150);
const DUST_CENTER = new THREE.Vector3(460.2, -371.5, -221.5);

/** Palette taken from the brand's light haze, storm slate and night navy. */
const COLORS = {
  light: new THREE.Color("#e8ecef"),
  dark: new THREE.Color("#5c7283"),
  globeBg: new THREE.Color("#5b6d7d"),
  night: new THREE.Color("#09192a"),
};

type Uniforms = Record<string, THREE.IUniform>;

/**
 * Full-screen WebGL backdrop for the home page. Draw order per frame:
 * sky -> globe (own telephoto camera) -> main scene (mountains, clouds, boat, forest) with the rail camera.
 */
export class MontfortScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly host: HTMLElement;
  private readonly main = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(55, 1.6, 1, 1000);
  private readonly skyScene = new THREE.Scene();
  private readonly skyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly globeScene = new THREE.Scene();
  private readonly globeCamera = new THREE.PerspectiveCamera(5, 1.6, 0.2, 200.2);

  private readonly clock = new THREE.Clock();
  private readonly gltf = new GLTFLoader();
  private readonly ktx2: KTX2Loader;
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly shared: Uniforms;

  private raf = 0;
  private disposed = false;
  private metrics: PageMetrics = { railLength: 1, footerTop: 1, viewportHeight: 1 };

  // Scene pieces (set once their model has loaded).
  private mountain?: THREE.Mesh;
  private peaks?: THREE.Object3D;
  private banks: THREE.Object3D[] = [];
  private streaks?: THREE.Object3D;
  private boat?: THREE.Object3D;
  private forest: THREE.Object3D[] = [];
  private dust?: THREE.Points;
  private globe?: THREE.Group;
  private readonly onReady: () => void;

  constructor(host: HTMLElement, onReady: () => void = () => {}) {
    this.host = host;
    this.onReady = onReady;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.autoClear = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2));
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cssText = "display:block;width:100%;height:100%";

    this.ktx2 = new KTX2Loader().setTranscoderPath("/vendor/basis/").detectSupport(this.renderer);
    this.gltf.setKTX2Loader(this.ktx2);

    const noise = this.texture("textures/noise.webp");
    const perlin = this.texture("textures/perlinNoise.webp");
    this.shared = {
      tNoise: { value: noise },
      tPerlin: { value: perlin },
      uTime: { value: 0 },
      uChapter: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uLight: { value: COLORS.light },
      uDark: { value: COLORS.dark },
    };

    this.buildSky();
    this.resize();
    void this.load();
  }

  /** Data textures are sampled raw (display-space) because every shader here writes display-space colours. */
  private texture(path: string): THREE.Texture {
    const cached = this.textures.get(path);
    if (cached) return cached;
    const tex = new THREE.TextureLoader().load(`${ASSET}/${path}`);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.NoColorSpace;
    tex.anisotropy = 4;
    this.textures.set(path, tex);
    return tex;
  }

  private buildSky() {
    const mat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tNoise: this.shared.tNoise,
        uChapter: this.shared.uChapter,
        uTime: this.shared.uTime,
        uAspect: { value: 1.6 },
        uLight: this.shared.uLight,
        uDark: this.shared.uDark,
        uGlobeBg: { value: COLORS.globeBg },
        uNight: { value: COLORS.night },
      },
    });
    this.skyScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  }

  private async load() {
    const url = (p: string) => `${ASSET}/models/${p}`;
    const [mountains, homepage] = await Promise.all([this.gltf.loadAsync(url("mountains.glb")), this.gltf.loadAsync(url("homepage/Homepage.glb"))]);
    if (this.disposed) return;
    this.setupMountains(mountains.scene);
    this.setupPeaks(homepage.scene);
    this.onReady();

    // Secondary models load in the background; the scene renders fine without them until their chapter.
    void this.gltf.loadAsync(url("homepage/TopChapters.glb")).then((g) => this.setupTopChapters(g.scene));
    void this.gltf.loadAsync(url("homepage/WhatWeDo.glb")).then((g) => this.setupBoat(g.scene));
    void this.gltf.loadAsync(url("homepage/earth-min.glb")).then((g) => this.setupGlobe(g.scene));
    void this.gltf.loadAsync(url("homepage/Sustainability-min.glb")).then((g) => this.setupForest(g.scene));
  }

  private bankMaterial(tile: [number, number], edge: number, opacity = 0.95): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: CLOUD_VERT,
      fragmentShader: CLOUD_BANK_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        tNoise: this.shared.tNoise,
        tPerlin: this.shared.tPerlin,
        uTime: this.shared.uTime,
        uChapter: this.shared.uChapter,
        uResolution: this.shared.uResolution,
        uLight: this.shared.uLight,
        uDark: this.shared.uDark,
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

  private setupMountains(root: THREE.Object3D) {
    root.updateMatrixWorld(true);
    const rockNormal = this.texture("textures/rock_normal.webp");

    const mountain = root.getObjectByName("Mountain") as THREE.Mesh | undefined;
    if (mountain) {
      mountain.material = new THREE.ShaderMaterial({
        vertexShader: MOUNTAIN_VERT,
        fragmentShader: MOUNTAIN_FRAG,
        uniforms: { ...this.hazeUniforms(), tRockNormal: { value: rockNormal }, tNoise: this.shared.tNoise, uDetail: { value: 1.6 }, uScale: { value: 0.045 } },
      });
      this.mountain = mountain;
      this.main.add(mountain);
    }

    const front = root.getObjectByName("Foreground") as THREE.InstancedMesh | undefined;
    const middle = root.getObjectByName("Middleground") as THREE.InstancedMesh | undefined;
    if (middle) {
      middle.material = this.bankMaterial([5, 3], 0.8, 0.96);
      middle.renderOrder = -1;
      this.banks.push(middle);
      this.main.add(middle);
    }
    if (front) {
      front.material = this.bankMaterial([5, 3], 0.84, 0.98);
      front.renderOrder = 1;
      this.banks.push(front);
      this.main.add(front);
    }
  }

  private setupPeaks(root: THREE.Object3D) {
    root.updateMatrixWorld(true);
    const decor = this.texture("textures/rock_normal.webp");
    void decor;
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const original = mesh.material as THREE.MeshStandardMaterial;
      const map = original.map;
      if (map) map.colorSpace = THREE.NoColorSpace;
      mesh.material = new THREE.ShaderMaterial({
        vertexShader: PEAK_VERT,
        fragmentShader: PEAK_FRAG,
        side: THREE.DoubleSide,
        uniforms: { ...this.hazeUniforms(), uFogLow: { value: 16 }, uFogHigh: { value: 42 }, tMap: { value: map } },
      });
    });
    this.peaks = root;
    this.main.add(root);
  }

  private setupTopChapters(root: THREE.Object3D) {
    if (this.disposed) return;
    root.updateMatrixWorld(true);
    const sparse = root.getObjectByName("SparseClouds") as THREE.Mesh | undefined;
    const sea = root.getObjectByName("CloudSea") as THREE.Mesh | undefined;
    if (sparse) {
      sparse.material = new THREE.ShaderMaterial({
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_STREAK_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          tNoise: this.shared.tNoise,
          tPerlin: this.shared.tPerlin,
          uTime: this.shared.uTime,
          uChapter: this.shared.uChapter,
          uLight: this.shared.uLight,
          uDark: this.shared.uDark,
          uOpacity: { value: 1 },
        },
      });
      this.streaks = sparse;
    }
    if (sea) {
      sea.material = this.bankMaterial([6, 2], 0.8, 0.92);
      this.banks.push(sea);
    }
    this.main.add(root);
  }

  private setupBoat(root: THREE.Object3D) {
    if (this.disposed) return;
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const map = (mesh.material as THREE.MeshStandardMaterial).map;
      if (map) map.colorSpace = THREE.NoColorSpace;
      mesh.material = new THREE.ShaderMaterial({
        vertexShader: SPRITE_VERT,
        fragmentShader: BOAT_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { tMap: { value: map }, uOpacity: { value: 1 }, uTint: { value: new THREE.Color(1, 1, 1) } },
      });
      mesh.renderOrder = 2;
    });
    this.boat = root;
    this.main.add(root);
  }

  private setupGlobe(root: THREE.Object3D) {
    if (this.disposed) return;
    let map: THREE.Texture | null = null;
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) map = (mesh.material as THREE.MeshStandardMaterial).map ?? map;
    });
    if (!map) return;
    (map as THREE.Texture).colorSpace = THREE.NoColorSpace;

    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(10, 96, 96);
    const earth = new THREE.Mesh(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader: GLOBE_VERT,
        fragmentShader: GLOBE_FRAG,
        uniforms: {
          tData: { value: map },
          tNoise: this.shared.tNoise,
          uTime: this.shared.uTime,
          uSunV: { value: SUN.clone().normalize() },
          uSea: { value: new THREE.Color("#082233") },
          uAmbient: { value: new THREE.Color("#085069") },
          uLand: { value: new THREE.Color("#2a3f52") },
          uRim: { value: new THREE.Color("#8f9c9f") },
          uOpacity: { value: 1 },
        },
      }),
    );
    const glow = new THREE.Mesh(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader: GLOBE_VERT,
        fragmentShader: GLOW_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: { uGlow: { value: new THREE.Color("#f4f6fb") }, uOpacity: { value: 1 } },
      }),
    );
    glow.scale.setScalar(1.02);
    group.add(earth, glow);
    this.globe = group;
    this.globeScene.add(group);
  }

  private setupForest(root: THREE.Object3D) {
    if (this.disposed) return;
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const map = (mesh.material as THREE.MeshStandardMaterial).map;
      if (map) map.colorSpace = THREE.NoColorSpace;
      const isBackground = mesh.name === "Forest-Background";
      mesh.material = new THREE.ShaderMaterial({
        vertexShader: FOREST_VERT,
        fragmentShader: FOREST_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          tMap: { value: map },
          uTime: this.shared.uTime,
          uOpacity: { value: 0 },
          uBlur: { value: isBackground ? 0.0035 : 0.0016 },
          uBrightness: { value: isBackground ? 0.62 : 0.5 },
          uTint: { value: new THREE.Color(0.9, 1, 1) },
        },
      });
      mesh.renderOrder = isBackground ? 0 : 1;
      this.forest.push(mesh);
    });
    this.main.add(root);

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
          uDpr: { value: this.renderer.getPixelRatio() },
          uTime: this.shared.uTime,
          uColor: { value: new THREE.Color("#b6fffb") },
          uOpacity: { value: 0 },
        },
      }),
    );
    this.dust.frustumCulled = false;
    this.main.add(this.dust);
  }

  /** Re-reads the page layout so the scene follows the DOM (call after fonts load and on resize). */
  setMetrics(metrics: PageMetrics) {
    this.metrics = metrics;
  }

  resize() {
    const w = this.host.clientWidth || window.innerWidth;
    const h = this.host.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.globeCamera.aspect = aspect;
    this.globeCamera.updateProjectionMatrix();
    const buffer = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    (this.shared.uResolution.value as THREE.Vector2).copy(buffer);
    this.skyScene.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
      if (mat?.uniforms?.uAspect) mat.uniforms.uAspect.value = aspect;
    });
  }

  start(getScroll: () => number) {
    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      this.render(getScroll());
    };
    this.raf = requestAnimationFrame(tick);
  }

  private render(scrollY: number) {
    const time = this.clock.getElapsedTime();
    const frame = sampleFrame(scrollY, this.metrics);
    const chapter = frame.chapter;
    this.shared.uTime.value = time;
    this.shared.uChapter.value = chapter;

    // Rail camera.
    const c = frame.camera;
    this.camera.position.set(c.x, c.y, c.z);
    this.camera.quaternion.set(c.qx, c.qy, c.qz, c.qw);
    this.camera.updateMatrixWorld();

    // Visibility by chapter.
    const alpine = chapter < 3.3;
    if (this.mountain) this.mountain.visible = alpine;
    if (this.peaks) this.peaks.visible = alpine;
    this.banks.forEach((b) => (b.visible = chapter < 3.4));
    if (this.streaks) this.streaks.visible = chapter > 1.9 && chapter < 3.2;

    if (this.boat) {
      const inView = chapter > 2.0 && chapter < 3.05;
      this.boat.visible = inView;
      const mat = (this.boat.children[0] as THREE.Mesh | undefined)?.material as THREE.ShaderMaterial | undefined;
      if (mat) {
        const storm = smoothstep(2.3, 2.6, chapter) * (1 - smoothstep(2.8, 3.0, chapter));
        mat.uniforms.uOpacity.value = smoothstep(2.0, 2.3, chapter) * (1 - smoothstep(2.95, 3.05, chapter));
        const k = 1 - 0.18 * storm;
        (mat.uniforms.uTint.value as THREE.Color).setRGB(k, k * 1.01, k * 1.04);
      }
      this.boat.position.y = Math.sin(time * 0.6) * 0.15;
    }

    // Forest, dust and the dark chapters.
    const night = smoothstep(4.02, 4.5, chapter);
    this.forest.forEach((m) => {
      m.visible = chapter > 3.95;
      ((m as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.uOpacity.value = night;
    });
    if (this.dust) {
      this.dust.visible = chapter > 3.95;
      (this.dust.material as THREE.ShaderMaterial).uniforms.uOpacity.value = smoothstep(4.1, 4.6, chapter) * 0.4;
    }

    // Globe pass.
    const globeAlpha = smoothstep(2.92, 3.2, chapter) * (1 - smoothstep(4.04, 4.16, chapter));
    const showGlobe = !!this.globe && globeAlpha > 0.001;
    if (this.globe) {
      this.globe.visible = showGlobe;
      if (showGlobe) {
        const e = frame.earth;
        this.globe.position.set(e.x, e.y, e.z);
        this.globe.rotation.y = e.rotation;
        this.globe.traverse((o) => {
          const mat = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
          if (mat?.uniforms?.uOpacity) mat.uniforms.uOpacity.value = globeAlpha;
        });
        this.globe.children.forEach((child) => {
          const mat = (child as THREE.Mesh).material as THREE.ShaderMaterial;
          if (mat.uniforms.uSunV) mat.uniforms.uOpacity.value = globeAlpha;
        });
      }
    }

    // Draw.
    this.renderer.clear();
    this.renderer.render(this.skyScene, this.skyCamera);
    if (showGlobe) {
      this.renderer.clearDepth();
      this.renderer.render(this.globeScene, this.globeCamera);
    }
    this.renderer.clearDepth();
    this.renderer.render(this.main, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    const scenes = [this.main, this.skyScene, this.globeScene];
    scenes.forEach((s) =>
      s.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) => m.dispose());
      }),
    );
    this.textures.forEach((t) => t.dispose());
    this.ktx2.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
