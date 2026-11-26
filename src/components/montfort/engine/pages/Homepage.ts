import * as THREE from "three";
import { Chapter, HeroChapter } from "../chapters/Chapter";
import { engine } from "../Engine";
import { Dragger, type DragState } from "../core/Dragger";
import type { TickInfo } from "../core/Emitter";
import { clamp, GLOBAL, type PageKey } from "../globals";
import { CHAPTER_MANIFESTS, PAGE_MANIFESTS } from "../manifests";
import type { CloudMaterial } from "../materials/core";
import { HomepageCloudsMaterial } from "../materials/homepage";
import { instanceDuplicates, replaceMaterials } from "../materials/registry";
import { Earth } from "../scene/Earth";
import { Particles } from "../scene/objects";
import { Page, type TransitionType } from "./Page";

const M = CHAPTER_MANIFESTS.Homepage;
const DEG = Math.PI / 180;

/** Hero: scrolling pushes the mountain fog back. */
class HomepageHero extends HeroChapter {
  constructor(key: string, sceneKey: string) {
    super(key, sceneKey);
  }

  createScrollTimeline() {
    const tl = super.createScrollTimeline();
    tl.to(engine().mainScene.mountains.mountainMaterial.uniforms.uFogFar, { value: 50, duration: 1, ease: "none" }, 0);
    return tl;
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.fromTo(GLOBAL.uChapter, { value: 0 }, { value: 1, duration: 1, ease: "none" }, 0);
    return tl;
  }
}

/** The long dive from the summit through the cloud sea: the camera follows the chapter's own rails. */
class TopChapters extends HeroChapter {
  private readonly clouds = new THREE.Object3D();

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.TopChapters);
  }

  enter() {
    super.enter();
    const e = engine();
    e.mainScene.add(this.clouds);
    e.mainScene.applyPreset(e.pages[this.sceneKey as PageKey]!.preset.scene);
  }

  loaded() {
    const model = this.assets!.get("topChapters");
    replaceMaterials(model);
    instanceDuplicates(model);
    const sparse = model.getObjectByName("SparseClouds") as THREE.Mesh;
    sparse.material = new HomepageCloudsMaterial();
    ((model.getObjectByName("CloudSea") as THREE.Mesh).material as CloudMaterial).uniforms.uSize.value.set(3, 2);
    model.renderOrder = 5;
    this.clouds.add(model);
  }

  leave() {
    super.leave();
    const e = engine();
    e.mainScene.remove(this.clouds);
    e.mainScene.applyPreset({ cloudsVisible: true, mountainsVisible: false, seaVisible: false, skyVisible: true });
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    const curve = this.getCurve();
    const progress = { value: 0 };
    const camera = engine().camera;
    tl.to(progress, {
      value: 1,
      duration: 1,
      onUpdate: () => {
        if (!curve) return;
        curve.position.getPoint(progress.value, camera.chapterPosition);
        curve.lookAt.getPoint(progress.value, camera.chapterLookAt);
      },
    }, 0);
    return tl;
  }
}

class WhoWeAre extends Chapter {
  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, undefined, true);
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.to(GLOBAL.uChapter, { value: 2, duration: 1, ease: "none" }, 0);
    return tl;
  }
}

/** Cargo ship sailing under the storm. */
class WhatWeDo extends Chapter {
  private readonly boat = new THREE.Object3D();

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.WhatWeDo, true);
  }

  enter() {
    super.enter();
    engine().mainScene.add(this.boat);
  }

  leave() {
    super.leave();
    engine().mainScene.remove(this.boat);
  }

  loaded() {
    this.boat.add(this.assets!.get("whatWeDo"));
    replaceMaterials(this.boat);
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.to(GLOBAL.uChapter, { value: 3, duration: 1, ease: "none" }, 0);
    return tl;
  }

  createScrollTimeline() {
    const tl = super.createScrollTimeline();
    tl.fromTo(this.boat.position, { z: -20 }, { z: 20, duration: 1 }, 0);
    tl.add(() => {}, 1);
    return tl;
  }
}

/** Draggable globe with the office cities; it spins and recedes as the chapter scrolls. */
class GlobalConnectivity extends Chapter {
  private readonly globeWrapper = new THREE.Object3D();
  private readonly globeEmpty = new THREE.Object3D();
  private readonly dragRotation = new THREE.Vector2();
  private readonly lerpedDragRotation = new THREE.Vector2();
  private readonly finalRotation = new THREE.Vector2();
  private readonly dragger: Dragger;
  private readonly bounds = { minLng: 120 * DEG, maxLng: 250 * DEG };
  private sun = { position: new THREE.Vector3(-100, 200, 150) };
  private earth?: Earth;
  private points?: HTMLElement[];
  animatedRotation = 0;

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.GlobalConnectivity, true);
    this.globeEmpty.rotation.order = "ZYX";
    this.dragger = new Dragger(document.documentElement, this.onDrag, {});
  }

  updateDom(el: HTMLElement) {
    this.points = Array.from(el.querySelectorAll<HTMLElement>("[data-point]"));
    this.earth?.setPoints(this.points);
  }

  loaded() {
    this.sun = { position: new THREE.Vector3(-100, 200, 150) };
    const plane = this.assets!.get("earth").getObjectByName("Plane") as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    this.earth = new Earth({ sun: this.sun, data: plane.material.map!, radius: 10 });
    this.earth.setPoints(this.points);
    this.earth.position.set(3, -5.8, -30);
    this.globeEmpty.add(this.earth);
    this.globeWrapper.add(this.globeEmpty);
  }

  enter() {
    super.enter();
    engine().mainScene.add(this.globeWrapper);
    this.dragger.init();
    this.dragRotation.set(0, 0);
    this.lerpedDragRotation.set(this.bounds.maxLng, 0);
    this.animatedRotation = this.bounds.maxLng;
    this.updateFinalRotation();
    engine().state.on("AFTER_RENDER", this.afterRender);
  }

  leave() {
    super.leave();
    engine().mainScene.remove(this.globeWrapper);
    this.dragger.clean();
    engine().state.off("AFTER_RENDER", this.afterRender);
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.to(GLOBAL.uChapter, { value: 4, duration: 1 }, 0);
    return tl;
  }

  createScrollTimeline() {
    const tl = super.createScrollTimeline();
    tl.fromTo(this, { animatedRotation: this.bounds.maxLng }, { animatedRotation: this.bounds.maxLng * 0.6, duration: 1, ease: "power1.in" }, 0);
    tl.to(this.earth!.position, { z: -100, duration: 1 }, 0);
    tl.to(this.earth!.position, { x: -5, y: -7, duration: 0.5, ease: "power1.in" }, 0.5);
    tl.fromTo(this.sun.position, { x: -100, y: 200 }, { x: -500, y: -150, duration: 0.3, ease: "power1.in" }, 0.7);
    tl.add(() => {}, 1);
    return tl;
  }

  private afterRender = ({ dt }: TickInfo) => {
    this.updateFinalRotation();
    this.lerpedDragRotation.lerp(this.finalRotation, dt * 2);
    if (!this.earth) return;
    this.earth.update();
    this.earth.rotation.x = -this.lerpedDragRotation.y;
    this.earth.rotation.y = this.lerpedDragRotation.x;
  };

  private updateFinalRotation() {
    this.finalRotation.y = this.dragRotation.y;
    this.finalRotation.x = clamp(this.dragRotation.x + this.animatedRotation, this.bounds.minLng, this.bounds.maxLng);
  }

  private onDrag = ({ delta }: DragState) => {
    const e = engine();
    if (!e.mouse.isTouch) {
      this.dragRotation.y -= (delta.y / e.viewport.height) * Math.PI * 2 * 0.5;
      this.dragRotation.y = clamp(this.dragRotation.y, -Math.PI * 0.1, Math.PI * 0.4);
    }
    const x = this.dragRotation.x + (delta.x / e.viewport.width) * Math.PI * 2 * 0.5;
    if (x + this.animatedRotation >= this.bounds.minLng && x + this.animatedRotation <= this.bounds.maxLng) this.dragRotation.x = x;
  };
}

/** Forest of the sustainability chapters with floating dust. */
class Sustainability extends Chapter {
  private readonly particles: Particles;
  private readonly forest = new THREE.Object3D();
  private readonly projected = new THREE.Vector3();

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.Sustainability, true);
    this.particles = new Particles();
  }

  enter() {
    super.enter();
    engine().mainScene.add(this.forest, this.particles);
    engine().state.on("TICK", this.tick);
  }

  leave() {
    super.leave();
    engine().mainScene.remove(this.forest, this.particles);
    engine().state.off("TICK", this.tick);
  }

  private tick = () => {
    this.projected.copy(this.particles.position);
    this.projected.project(engine().camera);
  };

  loaded() {
    const model = this.assets!.get("sustainability");
    replaceMaterials(model);
    this.particles.position.copy(model.getObjectByName("Particles")!.position);
    this.forest.add(model);
    ((model.getObjectByName("Forest-Background") as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.uProjectedPos = { value: this.projected };
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.to(GLOBAL.uChapter, { value: 5, duration: 1, ease: "none" }, 0);
    return tl;
  }
}

export class HomepagePage extends Page {
  private homepageEnv?: THREE.Object3D;

  constructor() {
    super("Homepage", { camera: { withCurve: true }, scene: { cloudsVisible: true, mountainsVisible: true, skyVisible: true, flaresVisible: false, env: "homepage" } }, PAGE_MANIFESTS.Homepage);
  }

  protected createChapters() {
    return {
      Hero: new HomepageHero("Hero", "Homepage"),
      TopChapters: new TopChapters("TopChapters", "Homepage"),
      WhoWeAre: new WhoWeAre("WhoWeAre", "Homepage"),
      WhatWeDo: new WhatWeDo("WhatWeDo", "Homepage"),
      GlobalConnectivity: new GlobalConnectivity("GlobalConnectivity", "Homepage"),
      Sustainability: new Sustainability("Sustainability", "Homepage"),
    };
  }

  protected loaded() {
    const a = this.assets!;
    const snow = a.get<THREE.Texture>("snow");
    const rock = a.get<THREE.Texture>("snowyRock");
    this.mountainsConfig = {
      envMapIntensity: 0.33,
      envMapRotation: new THREE.Euler(0, -1.77, 0),
      ambient: new THREE.Color(0xa7bbc5),
      ambientIntensity: 2.39,
      roughness: 0.4,
      color: new THREE.Color(0xffffff),
      armMap: a.get<THREE.Texture>("homepageLightmap"),
      map: snow,
      mapTransformRepeat: new THREE.Vector2(10, 10),
      mapTransformOffset: new THREE.Vector2(0, 0),
      mapTransformRotation: 0,
      map2: rock,
      map2TransformRepeat: new THREE.Vector2(1, 50),
      map2TransformOffset: new THREE.Vector2(0, 0),
      map2TransformRotation: 0,
      mixMap: a.get<THREE.Texture>("snowRockMix"),
      fogNear: 0.01,
      fogFar: 20,
    };
    snow.wrapS = snow.wrapT = THREE.RepeatWrapping;
    rock.wrapS = rock.wrapT = THREE.RepeatWrapping;
    this.homepageEnv = a.get("homepage");
    instanceDuplicates(this.homepageEnv);
    replaceMaterials(this.homepageEnv);
  }

  beforeEnter(transitionType?: TransitionType) {
    super.beforeEnter(transitionType);
    if (this.homepageEnv) engine().mainScene.mountains.add(this.homepageEnv);
  }

  afterLeave() {
    super.afterLeave();
    if (this.homepageEnv) engine().mainScene.mountains.remove(this.homepageEnv);
  }
}
