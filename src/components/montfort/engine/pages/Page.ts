import ScrollTrigger from "gsap/ScrollTrigger";
import * as THREE from "three";
import type { Chapter } from "../chapters/Chapter";
import { engine } from "../Engine";
import { Assets, type Manifest } from "../core/Assets";
import { GLOBAL, PAGE_COLORS, PAGES, type PageKey } from "../globals";
import type { MountainConfig } from "../materials/core";
import type { CameraPreset } from "../scene/CameraRig";
import type { ScenePreset } from "../scene/MainScene";

export interface PagePreset {
  camera?: CameraPreset;
  scene?: ScenePreset;
}

/**
 * A page of the site: loads its assets and chapters, wires every `[data-chapter]` of `[data-scene=<key>]`
 * to its chapter, positions the camera on the rail and applies the page's mountain look and colours.
 */
export abstract class Page {
  readonly assets?: Assets;
  readonly chapters: Record<string, Chapter>;
  readonly chaptersArr: Chapter[];
  readonly env = new THREE.Object3D();
  mountainsConfig?: MountainConfig;
  isLoaded = false;
  private readonly chaptersElements = new Map<HTMLElement, Chapter>();
  private readonly resizeObserver: ResizeObserver;

  constructor(readonly key: PageKey, readonly preset: PagePreset, manifest?: Manifest) {
    this.chapters = this.createChapters();
    this.chaptersArr = Object.values(this.chapters);
    this.resizeObserver = new ResizeObserver(this.onChapterResize);
    if (manifest) this.assets = new Assets(key, manifest, { isMobile: engine().viewport.isMobileAtLaunch, renderer: engine().renderer });
  }

  protected abstract createChapters(): Record<string, Chapter>;

  /** Called once the page manifest is loaded. */
  protected loaded() {}

  async load() {
    if (this.isLoaded) return;
    await this.assets?.load();
    this.loaded();
    await Promise.all(this.chaptersArr.filter((c) => !c.lazy).map((c) => c.load()));
    void (async () => {
      for (const c of this.chaptersArr.filter((c) => c.lazy)) await c.load();
    })();
    this.isLoaded = true;
  }

  get index() {
    return PAGES.indexOf(this.key);
  }

  beforeEnter() {
    const container = document.querySelector(`[data-scene=${this.key}]`);
    container?.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) => {
      const chapter = this.chapters[el.dataset.chapter ?? ""];
      if (!chapter) return;
      chapter.computeScrollRange(el, !!el.dataset.chapterFirst);
      this.resizeObserver.observe(el);
      this.chaptersElements.set(el, chapter);
    });
    const e = engine();
    e.camera.applyPreset(this.preset.camera, this.index);
    e.mainScene.applyPreset(this.preset.scene, this.index);
    GLOBAL.uPage.value = this.index;
    GLOBAL.uChapter.value = 0;
    e.state.on("TICK", this.onUpdateScroll);
    this.onUpdateScroll();
    this.chaptersBeforeFirstActive().forEach((c) => c.leave());
    if (this.mountainsConfig) e.mainScene.mountains.mountainMaterial.applyConfig(this.mountainsConfig);
    GLOBAL.uLightColor.value.copy(PAGE_COLORS[this.key][0]);
    GLOBAL.uDarkColor.value.copy(PAGE_COLORS[this.key][1]);
  }

  afterLeave() {
    this.chaptersElements.forEach((chapter, el) => {
      this.resizeObserver.unobserve(el);
      chapter.leave();
      chapter.destroy();
    });
    this.chaptersElements.clear();
    engine().state.off("TICK", this.onUpdateScroll);
  }

  onUpdateScroll = () => {
    const y = engine().lerpedScrollProgress;
    this.chaptersArr.forEach((c) => c.updateScroll(y));
  };

  private onChapterResize = (entries: ResizeObserverEntry[]) => {
    entries.forEach((entry) => {
      const el = entry.target as HTMLElement;
      if (document.contains(el) && this.chaptersElements.has(el)) {
        this.chaptersElements.get(el)!.computeScrollRange(el, !!el.dataset.chapterFirst);
        ScrollTrigger.refresh();
      }
    });
  };

  private chaptersBeforeFirstActive() {
    const i = this.chaptersArr.findLastIndex((c) => c.isActive);
    return i === -1 ? [] : this.chaptersArr.slice(0, i);
  }

  dispose() {
    this.afterLeave();
    this.resizeObserver.disconnect();
    this.chaptersArr.forEach((c) => c.dispose());
  }
}
