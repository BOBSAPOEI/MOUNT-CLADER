import * as THREE from "three";
import { Assets } from "./core/Assets";
import { Emitter, type EngineEvent, type TickInfo } from "./core/Emitter";
import { Mouse, Noise, Viewport } from "./core/Tools";
import { GLOBAL, lerp } from "./globals";
import { GLOBAL_MANIFEST } from "./manifests";
import { clearMaterialCache } from "./materials/registry";
import type { Page } from "./pages/Page";
import { CameraRig } from "./scene/CameraRig";
import { MainScene } from "./scene/MainScene";
import { MouseComputation } from "./scene/MouseComputation";

let instance: Engine | null = null;

/** The running engine (materials and chapters reach shared state through it, like the original's `E`). */
export function engine(): Engine {
  if (!instance) throw new Error("Montfort engine not initialised");
  return instance;
}

interface Bindable {
  bindMouse?(): void;
}

/**
 * Port of the original WebGL app: one renderer, one scene (mountain, sky, clouds, flares), a camera on the
 * page rail, the current page and its scroll-driven chapters.
 */
export class Engine {
  readonly state = new Emitter<EngineEvent>();
  readonly viewport: Viewport;
  readonly mouse: Mouse;
  readonly noise = new Noise();
  readonly renderer: THREE.WebGLRenderer;
  readonly mainScene = new MainScene();
  readonly camera: CameraRig;
  readonly assets: Assets;
  readonly lerpedMouse = new THREE.Vector2();
  mouseComputation?: MouseComputation;
  page?: Page;
  scrollProgress = 0;
  lerpedScrollProgress = 0;
  private absoluteScrollProgress = 0;
  private previousScrollProgress?: number;
  private raf = 0;
  private running = false;
  private last = 0;
  private elapsed = 0;
  private disposed = false;

  constructor(private readonly wrapper: HTMLElement, canvas: HTMLCanvasElement) {
    // Module-level singleton read through `engine()` by materials, chapters and pages.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;
    this.viewport = new Viewport(wrapper, this.state);
    this.mouse = new Mouse(this.viewport);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", canvas });
    THREE.ColorManagement.enabled = true;
    this.renderer.autoClear = false;
    this.renderer.debug.checkShaderErrors = process.env.NODE_ENV === "development";
    this.renderer.setClearColor(new THREE.Color(0xffffff), 0);
    this.camera = new CameraRig(this.viewport.ratio, () => this.viewport.breakpoint === "mobile");
    this.assets = new Assets("global", GLOBAL_MANIFEST, { isMobile: this.viewport.isMobileAtLaunch, renderer: this.renderer });
  }

  /** Loads the shared scenery, then the page, then attaches (same order as the original boot). */
  async init(createPage: () => Page) {
    await this.assets.load();
    if (this.disposed) return;
    const mountains = Assets.get<THREE.Object3D>("mountains");
    this.mainScene.setup(this.renderer, Assets.get<THREE.DataTexture>("envMap"), mountains);
    this.camera.setupCurves(mountains);
    if (!this.mouse.isTouch) this.mouseComputation = new MouseComputation(this.renderer, this.mouse);
    this.page = createPage();
    await this.page.load();
    if (this.disposed) return;
    this.attach();
    this.onResize(this.viewport.infos);
  }

  private attach() {
    this.viewport.attach();
    this.mouse.attach();
    this.mainScene.traverse((o) => ((o as THREE.Mesh).material as Bindable | undefined)?.bindMouse?.());
    (this.mainScene.transitionClouds.material as Bindable).bindMouse?.();
    this.lerpedMouse.copy(this.mouse.coordinates.webgl);
    this.scrollProgress = this.lerpedScrollProgress = window.scrollY;
    // The camera ticks before the page's scroll update (it was registered first in the original).
    this.state.on("TICK", this.onCameraTick);
    this.page?.beforeEnter();
    this.wrapper.prepend(this.renderer.domElement);
    this.state.on("RESIZE", this.onResize);
    this.state.on("BEFORE_TICK", this.beforeTick);
    this.state.on("RENDER", this.render);
    this.start();
  }

  private onResize = ({ width, height, dpr, ratio }: { width: number; height: number; dpr: number; ratio: number }) => {
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr);
    this.camera.resize(ratio);
    this.render();
  };

  private beforeTick = ({ et, dt }: TickInfo) => {
    GLOBAL.uTime.value = et;
    this.lerpedMouse.lerp(this.mouse.coordinates.webgl, dt * 3);
    this.scrollProgress = Math.max(0, window.scrollY);
    if (Math.abs(this.scrollProgress - this.lerpedScrollProgress) > 1e-4) this.lerpedScrollProgress = lerp(this.lerpedScrollProgress, this.scrollProgress, dt * 2);
    const delta = this.scrollProgress - (this.previousScrollProgress ?? this.scrollProgress);
    this.absoluteScrollProgress += Math.abs(delta);
    this.previousScrollProgress = this.scrollProgress;
    GLOBAL.uScrollProgress.value = this.lerpedScrollProgress / this.viewport.height;
    GLOBAL.uAbsScrollProgress.value = this.absoluteScrollProgress / this.viewport.height;
    this.mouseComputation?.update(dt);
  };

  private onCameraTick = ({ dt }: TickInfo) => {
    this.mainScene.flares?.material.update(this.camera);
    this.camera.update(dt, this.mouse.coordinates.webgl, this.mouse.isTouch);
  };

  private render = () => {
    if (!this.page) return;
    this.renderer.clear();
    this.renderer.render(this.mainScene, this.camera);
  };

  private start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const now = performance.now();
      const delta = Math.min(now - this.last, 60);
      this.last = now;
      this.elapsed += delta;
      const info: TickInfo = { et: this.elapsed * 0.001, dt: delta * 0.001 };
      this.state.emit("BEFORE_TICK", info);
      this.state.emit("TICK", info);
      this.state.emit("RENDER", info);
    };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.page?.dispose();
    this.viewport.detach();
    this.mouse.detach();
    this.state.clear();
    this.mainScene.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    clearMaterialCache();
    this.mouseComputation?.dispose();
    this.noise.dispose();
    Assets.disposeAll();
    this.renderer.dispose();
    if (instance === this) instance = null;
  }
}
