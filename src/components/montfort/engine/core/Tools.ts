import * as THREE from "three";
import { BREAKPOINTS, VIEWPORT } from "../globals";
import type { Emitter, EngineEvent } from "./Emitter";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export interface ViewportInfo {
  width: number;
  height: number;
  dpr: number;
  ratio: number;
  breakpoint: Breakpoint;
}

/** Tracks the canvas wrapper size and mirrors it into the viewport uniforms. */
export class Viewport {
  readonly infos: ViewportInfo = { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio, ratio: 1, breakpoint: "mobile" };
  readonly isMobileAtLaunch: boolean;
  private readonly observer: ResizeObserver;

  constructor(private readonly wrapper: HTMLElement, private readonly state: Emitter<EngineEvent>) {
    const rect = wrapper.getBoundingClientRect();
    this.set(Math.min(window.innerWidth, rect.width), rect.height);
    this.observer = new ResizeObserver(this.onResize);
    this.isMobileAtLaunch = this.infos.breakpoint === "mobile";
  }

  attach() {
    this.observer.observe(this.wrapper);
  }

  detach() {
    this.observer.disconnect();
  }

  onResize = (entries?: ResizeObserverEntry[]) => {
    let width: number;
    let height: number;
    const box = entries?.[0]?.contentBoxSize;
    if (box) {
      const size = Array.isArray(box) ? box[0] : (box as unknown as ResizeObserverSize);
      width = size.inlineSize;
      height = size.blockSize;
    } else {
      const rect = this.wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    }
    this.set(width, height);
    this.state.emit("RESIZE", this.infos);
  };

  private set(width: number, height: number) {
    const i = this.infos;
    i.width = width;
    i.height = height;
    i.dpr = Math.min(2, window.devicePixelRatio);
    i.ratio = width / height;
    i.breakpoint = window.innerWidth < BREAKPOINTS.tablet ? "mobile" : window.innerWidth < BREAKPOINTS.desktop ? "tablet" : "desktop";
    VIEWPORT.uRatio.value = i.ratio;
    VIEWPORT.uDPR.value = i.dpr;
    VIEWPORT.uResolution.value.set(i.width * i.dpr, i.height * i.dpr);
    VIEWPORT.uMobile.value = i.breakpoint === "mobile" ? 1 : 0;
  }

  get width() {
    return this.infos.width;
  }
  get height() {
    return this.infos.height;
  }
  get ratio() {
    return this.infos.ratio;
  }
  get breakpoint() {
    return this.infos.breakpoint;
  }
}

/** Pointer position in NDC (`webgl`) and pixels (`dom`). */
export class Mouse {
  isTouch: boolean;
  isDown = false;
  readonly coordinates = { webgl: new THREE.Vector2(), dom: new THREE.Vector2() };

  constructor(private readonly viewport: Viewport) {
    this.isTouch = window.matchMedia("(pointer: coarse)").matches || typeof window.ontouchstart === "function" || navigator.maxTouchPoints > 0;
  }

  attach() {
    this.coordinates.dom.set(this.viewport.width * 0.5, this.viewport.height * 0.5);
    window.addEventListener("mousemove", this.onMove);
    window.addEventListener("touchmove", this.onMove, { passive: true });
    window.addEventListener("pointerdown", this.onDown);
    window.addEventListener("mouseup", this.onUp);
    window.addEventListener("touchend", this.onUp);
  }

  detach() {
    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("mouseup", this.onUp);
    window.removeEventListener("touchend", this.onUp);
  }

  private onMove = (e: MouseEvent | TouchEvent) => {
    if (this.isTouch) {
      const t = (e as TouchEvent).touches?.[0];
      if (t) this.setPosition(t.clientX, t.clientY);
    } else {
      this.setPosition((e as MouseEvent).clientX, (e as MouseEvent).clientY);
    }
  };

  private onDown = (e: PointerEvent) => {
    if (this.isDown) return;
    this.isTouch = e.pointerType !== "mouse";
    this.setPosition(e.clientX, e.clientY);
    this.isDown = true;
  };

  private onUp = () => {
    this.isDown = false;
  };

  private setPosition(x: number, y: number) {
    this.coordinates.webgl.set((x / this.viewport.width) * 2 - 1, -(y / this.viewport.height) * 2 + 1);
    this.coordinates.dom.set(x, y);
  }
}

/** 256² random-noise canvas texture, linear and nearest filtered. */
export class Noise {
  readonly texture: THREE.CanvasTexture;
  readonly nearestTexture: THREE.CanvasTexture;

  constructor() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.getImageData(0, 0, 256, 256);
    for (let i = 0; i < img.data.length; i++) img.data[i] = Math.round(Math.random() * 255);
    ctx.putImageData(img, 0, 0);
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.minFilter = this.texture.magFilter = THREE.LinearFilter;
    this.nearestTexture = new THREE.CanvasTexture(canvas);
    this.nearestTexture.wrapS = this.nearestTexture.wrapT = THREE.RepeatWrapping;
    this.nearestTexture.minFilter = this.nearestTexture.magFilter = THREE.NearestFilter;
  }

  dispose() {
    this.texture.dispose();
    this.nearestTexture.dispose();
  }
}
