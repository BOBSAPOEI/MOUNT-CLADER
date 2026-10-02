import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { ASSET } from "@/lib/montfort/content";
import { PALETTE, type SceneContext, type SceneLayer, type Uniforms } from "./core";
import { AlpineLayer } from "./layers/AlpineLayer";
import { ForestLayer } from "./layers/ForestLayer";
import { GlobeLayer } from "./layers/GlobeLayer";
import { SkyLayer } from "./layers/SkyLayer";
import { StormLayer } from "./layers/StormLayer";
import { sampleFrame, type PageMetrics } from "./timeline";

/**
 * Full-screen WebGL backdrop for the home page. Each chapter's scenery is a layer; per frame the
 * engine draws sky -> globe (own telephoto camera) -> main scene (rail camera).
 */
export class MontfortScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly host: HTMLElement;
  private readonly ctx: SceneContext;
  private readonly skyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly clock = new THREE.Clock();
  private readonly ktx2: KTX2Loader;
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly layers: SceneLayer[];
  private readonly globeLayer = new GlobeLayer();

  private raf = 0;
  private disposed = false;
  private metrics: PageMetrics = { railLength: 1, footerTop: 1, viewportHeight: 1 };

  constructor(host: HTMLElement, onReady: () => void = () => {}) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.autoClear = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2));
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cssText = "display:block;width:100%;height:100%";

    this.ktx2 = new KTX2Loader().setTranscoderPath("/vendor/basis/").detectSupport(this.renderer);
    const gltf = new GLTFLoader().setKTX2Loader(this.ktx2);

    const shared: Uniforms = {
      tNoise: { value: this.texture("textures/noise.webp") },
      tPerlin: { value: this.texture("textures/perlinNoise.webp") },
      uTime: { value: 0 },
      uChapter: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uLight: { value: PALETTE.light },
      uDark: { value: PALETTE.dark },
    };

    this.ctx = {
      renderer: this.renderer,
      main: new THREE.Scene(),
      globe: new THREE.Scene(),
      sky: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(55, 1.6, 1, 1000),
      globeCamera: new THREE.PerspectiveCamera(5, 1.6, 0.2, 200.2),
      gltf,
      shared,
      texture: (path) => this.texture(path),
      model: (path) => `${ASSET}/models/${path}`,
      isDisposed: () => this.disposed,
    };

    const sky = new SkyLayer();
    const alpine = new AlpineLayer();
    this.layers = [sky, alpine, new StormLayer(), this.globeLayer, new ForestLayer()];

    void sky.load(this.ctx);
    this.resize();
    // The hero scenery gates the fade-in; the other chapters stream in behind it.
    void Promise.resolve(alpine.load(this.ctx)).then(() => {
      if (this.disposed) return;
      onReady();
      this.layers.filter((l) => l !== sky && l !== alpine).forEach((l) => void l.load(this.ctx));
    });
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

  /** Re-reads the page layout so the scene follows the DOM (call after fonts load and on resize). */
  setMetrics(metrics: PageMetrics) {
    this.metrics = metrics;
  }

  resize() {
    const w = this.host.clientWidth || window.innerWidth;
    const h = this.host.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    for (const cam of [this.ctx.camera, this.ctx.globeCamera]) {
      cam.aspect = aspect;
      cam.updateProjectionMatrix();
    }
    const buffer = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    (this.ctx.shared.uResolution.value as THREE.Vector2).copy(buffer);
    this.layers.forEach((l) => l.resize?.(buffer.x, buffer.y, aspect));
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
    this.ctx.shared.uTime.value = time;
    this.ctx.shared.uChapter.value = frame.chapter;

    const c = frame.camera;
    this.ctx.camera.position.set(c.x, c.y, c.z);
    this.ctx.camera.quaternion.set(c.qx, c.qy, c.qz, c.qw);
    this.ctx.camera.updateMatrixWorld();

    this.layers.forEach((l) => l.update(frame, time));

    this.renderer.clear();
    this.renderer.render(this.ctx.sky, this.skyCamera);
    if (this.globeLayer.needsGlobePass()) {
      this.renderer.clearDepth();
      this.renderer.render(this.ctx.globe, this.ctx.globeCamera);
    }
    this.renderer.clearDepth();
    this.renderer.render(this.ctx.main, this.ctx.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    [this.ctx.main, this.ctx.sky, this.ctx.globe].forEach((s) =>
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
