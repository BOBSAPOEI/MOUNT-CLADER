import * as THREE from "three";
import { Chapter, HeroChapter } from "../chapters/Chapter";
import { engine } from "../Engine";
import type { TickInfo } from "../core/Emitter";
import { GLOBAL, type PageKey } from "../globals";
import { CHAPTER_MANIFESTS, PAGE_MANIFESTS } from "../manifests";
import { GridPlane, HoverParticles, Particles, WireframeInstances } from "../scene/objects";
import { Page, type TransitionType } from "./Page";

const M = CHAPTER_MANIFESTS.Trading;

class TradingHero extends HeroChapter {
  private hoverParticles?: HoverParticles;

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.Hero);
    this.cameraMovement.position = new THREE.Vector3(0, 0, -20);
    this.cameraMovement.lookAt = new THREE.Vector3(0, -100, 0);
  }

  enter() {
    super.enter();
    const e = engine();
    e.state.on("TICK", this.tick);
    e.mainScene.applyPreset(e.pages[this.sceneKey as PageKey]!.preset.scene);
    const raycaster = this.assets!.get("raycaster").getObjectByName("Raycaster") as THREE.Mesh;
    raycaster.visible = false;
    if (!e.mouse.isTouch) {
      this.hoverParticles = new HoverParticles(raycaster);
      e.mainScene.add(this.hoverParticles);
    }
  }

  leave() {
    super.leave();
    const e = engine();
    e.state.off("TICK", this.tick);
    e.mainScene.applyPreset({ cloudsVisible: false, flaresVisible: false, mountainsVisible: false, skyVisible: false });
    if (this.hoverParticles) e.mainScene.remove(this.hoverParticles);
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.fromTo(GLOBAL.uChapter, { value: 0 }, { value: 1, duration: 1 });
    return tl;
  }

  private tick = ({ dt }: TickInfo) => this.hoverParticles?.update(dt);
}

/** Two endless grids (floor and ceiling) scrolling through the products section. */
class TradingChapter extends Chapter {
  private grid!: GridPlane;
  private grid2!: GridPlane;

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, undefined, true);
  }

  loaded() {
    this.grid = new GridPlane({ lineWidth: 0, backgroundColor: new THREE.Color("#123e4f"), infiniteMovement: true, speed: 0.01 });
    this.grid2 = this.grid.clone();
    this.grid.rotation.set(-1.67, 0.3, 0.15);
    this.grid.position.set(0, -20, 250);
    this.grid.scale.setScalar(500);
    this.grid2.rotation.set(1.47, -0.3, -0.15);
    this.grid2.position.set(25, 100, 250);
    this.grid2.scale.setScalar(500);
    this.add(this.grid, this.grid2);
  }

  createScrollTimeline() {
    const tl = super.createScrollTimeline();
    const u = this.grid.material.uniforms;
    tl.fromTo(u.uFade, { value: 0 }, { value: 1, duration: 0.05 }, 0);
    tl.fromTo(u.uTranslate.value, { y: 0 }, { y: 0.5, duration: 1 }, 0);
    tl.to(u.uFade, { value: 0, duration: 0.05 }, ">-.05");
    return tl;
  }
}

class Oil extends Chapter {
  private instanced!: WireframeInstances;

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.Oil, true);
  }

  loaded() {
    const group = new THREE.Group();
    group.position.set(0, -3, 3);
    group.rotation.set(-0.82, 0, -0.4);
    const barrel = this.assets!.get("oilMetals").getObjectByName("Barrel") as THREE.Mesh;
    this.instanced = new WireframeInstances(barrel, "oil", 6);
    this.add(group.add(this.instanced));
  }

  createScrollTimeline() {
    const tl = super.createScrollTimeline();
    const fade = this.instanced.material.uniforms.uFadeProgress;
    tl.fromTo(fade, { value: 0 }, { value: 1, duration: 0.1 }, 0);
    tl.to(fade, { value: 0, duration: 0.1 }, 0.6);
    tl.fromTo(this.instanced, { visible: true }, { visible: false, duration: 0.001 }, ">");
    tl.add(() => {}, 1);
    return tl;
  }
}

class Metals extends Chapter {
  private instanced!: WireframeInstances;

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.Metals, true);
  }

  loaded() {
    const group = new THREE.Group();
    group.position.set(0, -3, 5);
    group.rotation.set(-0.82, 0, -0.4);
    const metal = this.assets!.get("oilMetals").getObjectByName("metal") as THREE.Mesh;
    this.instanced = new WireframeInstances(metal, "metal", 6);
    this.instanced.renderOrder = -1;
    this.add(group.add(this.instanced));
  }

  createScrollTimeline() {
    const tl = super.createScrollTimeline();
    const fade = this.instanced.material.uniforms.uFadeProgress;
    tl.fromTo(this.instanced, { visible: false }, { visible: true, duration: 0.001 }, 0.2);
    tl.fromTo(fade, { value: 0 }, { value: 1, duration: 0.1 }, "<");
    tl.to(fade, { value: 0, duration: 0.1 }, 0.7);
    tl.add(() => {}, 1);
    return tl;
  }
}

export class TradingPage extends Page {
  private readonly particles: Particles;

  constructor() {
    super("Trading", { camera: { withCurve: true }, scene: { cloudsVisible: false, mountainsVisible: true, skyVisible: true, flaresVisible: false, env: "trading" } }, PAGE_MANIFESTS.Trading);
    this.particles = new Particles(80, new THREE.Vector3(50, 50, 10), new THREE.Color(0x77bed0), 4);
    this.particles.position.set(20, -10, -40);
  }

  protected createChapters() {
    return {
      Hero: new TradingHero("Hero", "Trading"),
      TradingChapter: new TradingChapter("TradingChapter", "Trading"),
      Oil: new Oil("Oil", "Trading"),
      Metals: new Metals("Metals", "Trading"),
    };
  }

  protected loaded() {
    const a = this.assets!;
    const snow = a.get<THREE.Texture>("snow");
    const rock = a.get<THREE.Texture>("rock");
    snow.wrapS = snow.wrapT = THREE.RepeatWrapping;
    rock.wrapS = rock.wrapT = THREE.RepeatWrapping;
    this.mountainsConfig = {
      envMapIntensity: 0.43,
      envMapRotation: new THREE.Euler(0, 0, 0),
      ambient: new THREE.Color(0x24648c),
      ambientIntensity: 1.2,
      roughness: 0.9,
      color: new THREE.Color(0xffffff),
      armMap: a.get<THREE.Texture>("tradingLightmap"),
      map: snow,
      mapTransformRepeat: new THREE.Vector2(15, 15),
      mapTransformOffset: new THREE.Vector2(0, 0),
      mapTransformRotation: 0,
      map2: rock,
      map2TransformRepeat: new THREE.Vector2(30, 30),
      map2TransformOffset: new THREE.Vector2(0, 0),
      map2TransformRotation: 0,
      mixMap: a.get<THREE.Texture>("snowRockMix"),
      fogNear: 0.01,
      fogFar: 30,
    };
  }

  beforeEnter(transitionType?: TransitionType) {
    super.beforeEnter(transitionType);
    engine().mainScene.mountains.add(this.particles);
  }

  afterLeave() {
    super.afterLeave();
    engine().mainScene.mountains.remove(this.particles);
  }
}
