import gsap from "gsap";
import * as THREE from "three";
import { engine } from "../Engine";
import { Assets, type Manifest } from "../core/Assets";
import { clamp, mapRange, type PageKey } from "../globals";
import { curveFromGeometry } from "../scene/CameraRig";

export interface ScrollRange {
  start: number;
  end: number;
  height: number;
}

/**
 * One `[data-chapter]` of a page. Two paused GSAP timelines are scrubbed by the lerped scroll position:
 * `scrollTl` over [top - viewport, bottom] and `noOverlapScrollTl` over [top - viewport, bottom - viewport].
 * The chapter's 3D content is added to the scene while its range is on screen.
 */
export class Chapter extends THREE.Object3D {
  readonly assets?: Assets;
  isLoaded = false;
  isActive = false;
  scrollTl?: gsap.core.Timeline;
  noOverlapScrollTl?: gsap.core.Timeline;
  scrollRange?: ScrollRange;
  noOverlapScrollRange?: ScrollRange;

  constructor(readonly key: string, readonly sceneKey: string, manifest?: Manifest, readonly lazy = false) {
    super();
    if (manifest) this.assets = new Assets(`${sceneKey}-${key}`, manifest, { isMobile: engine().viewport.isMobileAtLaunch, renderer: engine().renderer });
  }

  async load() {
    if (this.isLoaded) return;
    await this.assets?.load();
    this.loaded();
    this.isLoaded = true;
    this.createScrollTimelines();
  }

  createScrollTimelines() {
    this.scrollTl?.kill();
    this.noOverlapScrollTl?.kill();
    this.scrollTl = this.createScrollTimeline();
    this.noOverlapScrollTl = this.createNoOverlapScrollTimeline();
  }

  loaded() {}

  /** Called with the chapter's element each time its page is entered (e.g. to pick up DOM markers). */
  updateDom?(el: HTMLElement): void;

  computeScrollRange(el: HTMLElement, first: boolean) {
    const { height, top } = el.getBoundingClientRect();
    let start = top + window.scrollY;
    const end = start + height;
    start -= first ? 0 : engine().viewport.height;
    this.scrollRange = { start, end, height };
    this.noOverlapScrollRange = { start, end: end - engine().viewport.height, height };
    this.applyTransforms();
  }

  enter() {
    engine().mainScene.add(this);
    this.applyTransforms();
    this.isActive = true;
  }

  leave() {
    engine().mainScene.remove(this);
    this.isActive = false;
  }

  destroy() {
    this.scrollTl?.progress(0);
    this.noOverlapScrollTl?.progress(0);
    this.isActive = false;
  }

  updateScroll(y: number) {
    const no = this.noOverlapScrollRange;
    if (no) this.noOverlapScrollTl?.progress(clamp(mapRange(y, no.start, no.end, 0, 1), 0, 1), false);
    const r = this.scrollRange;
    if (!r) return;
    this.scrollTl?.progress(clamp(mapRange(y, r.start, r.end, 0, 1), 0, 1), false);
    if (y >= r.start && y < r.end) {
      if (!this.isActive) this.enter();
    } else if (this.isActive) this.leave();
  }

  createScrollTimeline() {
    return gsap.timeline({ paused: true });
  }

  createNoOverlapScrollTimeline() {
    return gsap.timeline({ paused: true });
  }

  /** Places the chapter where the camera ends up after the hero's movement, facing the hero's target. */
  applyTransforms() {
    const camera = engine().camera;
    const position = camera.targetPosition.clone();
    const lookAt = camera.targetLookAt.clone();
    const hero = engine().pages[this.sceneKey as PageKey]?.chapters.Hero as HeroChapter | undefined;
    if (hero?.cameraMovement.position) position.add(hero.cameraMovement.position);
    if (hero?.cameraMovement.lookAt) lookAt.add(hero.cameraMovement.lookAt);
    this.position.copy(position);
    this.lookAt(lookAt);
  }

  /** Camera rails authored for this chapter in mountains.glb (`Path-<key>` / `TargetPath-<key>`). */
  getCurve() {
    const mountains = Assets.get<THREE.Object3D>("mountains");
    const path = mountains.getObjectByName(`Path-${this.key}`)?.removeFromParent() as THREE.Mesh | undefined;
    const target = mountains.getObjectByName(`TargetPath-${this.key}`)?.removeFromParent() as THREE.Mesh | undefined;
    if (!path || !target) return undefined;
    return {
      position: curveFromGeometry(path.geometry, mountains.getObjectByName(`Point-${this.sceneKey}`)?.position),
      lookAt: curveFromGeometry(target.geometry, mountains.getObjectByName(`TargetPoint-${this.sceneKey}`)?.position),
    };
  }

  dispose() {
    this.scrollTl?.kill();
    this.noOverlapScrollTl?.kill();
  }
}

/** Page hero: scrolling through it moves the camera by `cameraMovement` (added to the rail pose). */
export class HeroChapter extends Chapter {
  readonly cameraMovement: { position?: THREE.Vector3; lookAt?: THREE.Vector3 } = {};

  createScrollTimeline() {
    const tl = super.createScrollTimeline();
    const camera = engine().camera;
    const { position, lookAt } = this.cameraMovement;
    if (position) tl.to(camera.chapterPosition, { x: position.x, y: position.y, z: position.z, duration: 1 }, 0);
    if (lookAt) tl.to(camera.chapterLookAt, { x: lookAt.x, y: lookAt.y, z: lookAt.z, duration: 1 }, 0);
    return tl;
  }
}
