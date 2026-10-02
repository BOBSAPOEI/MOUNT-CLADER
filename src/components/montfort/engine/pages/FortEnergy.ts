import * as THREE from "three";
import { Chapter, HeroChapter } from "../chapters/Chapter";
import { engine } from "../Engine";
import { GLOBAL } from "../globals";
import { CHAPTER_MANIFESTS, PAGE_MANIFESTS } from "../manifests";
import { replaceMaterials } from "../materials/registry";
import { GridMaterial } from "../materials/trading";
import { Page } from "./Page";

const M = CHAPTER_MANIFESTS.FortEnergy;

type UniformMesh = THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

class FortEnergyHero extends HeroChapter {
  constructor(key: string, sceneKey: string) {
    super(key, sceneKey);
    this.cameraMovement.position = new THREE.Vector3(0, 0, -20);
    this.cameraMovement.lookAt = new THREE.Vector3(0, -500, 0);
  }

  enter() {
    super.enter();
    const e = engine();
    e.mainScene.applyPreset(e.page!.preset.scene);
    e.page!.env.visible = true;
  }

  leave() {
    super.leave();
    const e = engine();
    e.mainScene.applyPreset({ cloudsVisible: false, flaresVisible: false, mountainsVisible: true, skyVisible: false, seaVisible: false });
    e.page!.env.visible = false;
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.fromTo(GLOBAL.uChapter, { value: 0 }, { value: 1, duration: 1, ease: "none" }, 0);
    return tl;
  }
}

const byIndex = (prefix: string) => (a: THREE.Object3D, b: THREE.Object3D) => parseInt(a.name.replace(prefix, "")) - parseInt(b.name.replace(prefix, ""));

/**
 * Holographic power-grid flythrough. The chapter model is drawn through the tertiary camera, which
 * follows the glTF camera / look-at empties along centripetal curves as the chapter scrolls.
 */
class FortEnergyChapter extends Chapter {
  private readonly wrapper = new THREE.Object3D();
  private cameraLookAt = new THREE.Vector3();
  private cameraPosition = new THREE.Vector3();
  private readonly pageProgress = { value: 0 };
  private grid!: UniformMesh;
  private holograms: UniformMesh[] = [];
  private lines: UniformMesh[] = [];
  private camCurve?: THREE.CatmullRomCurve3;
  private lookAtCurve?: THREE.CatmullRomCurve3;

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.FortEnergyChapter, true);
  }

  loaded() {
    const model = this.assets!.get("energyChapter");
    replaceMaterials(model);
    this.grid = model.getObjectByName("Grid") as UniformMesh;
    this.grid.material = new GridMaterial({
      lineWidth: 0.01,
      lineColor: new THREE.Color("#4e8399"),
      backgroundColor: new THREE.Color("#1a697f"),
      accentColor: new THREE.Color("#7a9fb6"),
      pointColor: new THREE.Color("#519abc"),
      backgroundNoise: 1,
      brightness: 1.6,
      crossSize: 0.2,
      gridScale: 150,
      pointSize: 0,
      depth: 100,
    });
    const cameras: THREE.Object3D[] = [];
    const lookAts: THREE.Object3D[] = [];
    const tertiary = engine().camera.tertiaryCamera;
    model.traverse((o) => {
      const mesh = o as UniformMesh;
      if (mesh.isMesh && mesh.material?.uniforms) {
        mesh.frustumCulled = false;
        mesh.material.uniforms.projectionMatrix = { value: tertiary.projectionMatrix };
        mesh.material.uniforms.viewMatrix = { value: tertiary.matrixWorldInverse };
        mesh.material.side = THREE.DoubleSide;
      }
      if ((o as THREE.PerspectiveCamera).isPerspectiveCamera) cameras.push(o);
      if (o.name.startsWith("LookAt")) lookAts.push(o);
      if (o.name.startsWith("Line")) this.lines.push(mesh);
      if (o.name.startsWith("Hologram")) this.holograms.push(mesh);
    });
    cameras.sort(byIndex("Camera"));
    lookAts.sort(byIndex("LookAt"));
    this.cameraPosition.copy(cameras[0].position);
    this.cameraLookAt.copy(lookAts[0].position);
    this.camCurve = new THREE.CatmullRomCurve3(
      cameras.map((c) => c.position),
      false,
      "centripetal",
    );
    this.lookAtCurve = new THREE.CatmullRomCurve3(
      lookAts.map((l) => l.position),
      false,
      "centripetal",
    );
    this.wrapper.add(model);
  }

  enter() {
    super.enter();
    engine().mainScene.add(this.wrapper);
    engine().state.on("TICK", this.tick);
  }

  leave() {
    super.leave();
    engine().mainScene.remove(this.wrapper);
    engine().state.off("TICK", this.tick);
  }

  createScrollTimeline() {
    const tl = super.createScrollTimeline();
    const fade = (m: UniformMesh) => m.material.uniforms.uFade;
    tl.fromTo([this.grid, ...this.lines].map(fade), { value: 0 }, { value: 1, duration: 0.1 }, 0);
    tl.fromTo(this.pageProgress, { value: 0 }, { value: 1, duration: 1, ease: "sine.out" }, 0);
    const start = 0.5;
    const span = 0.3;
    const [h0, h1, h2, h3] = this.holograms;
    tl.fromTo(fade(h0), { value: 0 }, { value: 1, duration: 0.1 }, 0);
    tl.to(fade(h0), { value: 0, duration: 0.06 }, 0.17);
    tl.fromTo(fade(h1), { value: 0 }, { value: 1, duration: 0.08 }, 0.32);
    tl.to(fade(h1), { value: 0, duration: 0.1 }, 0.5);
    tl.to(this.grid.material.uniforms.uDepth, { value: 120, duration: span }, start);
    tl.fromTo(fade(h2), { value: 0 }, { value: 1, duration: span }, start + span * 0.4 + 0.1);
    tl.fromTo(h3.material.uniforms.uOffset, { value: 0 }, { value: 0.1, duration: span * 0.8 }, start + span * 0.4 + 0.2);
    tl.fromTo(fade(h3), { value: 0 }, { value: 1, duration: span }, start + span * 0.4 + 0.15);
    tl.add(() => {}, 1.2);
    return tl;
  }

  private tick = () => {
    if (this.camCurve) this.cameraPosition = this.camCurve.getPoint(this.pageProgress.value);
    if (this.lookAtCurve) this.cameraLookAt = this.lookAtCurve.getPoint(this.pageProgress.value);
    const rig = engine().camera;
    rig.tertiaryCamera.position.copy(this.cameraPosition);
    rig.tertiaryCamera.lookAt(this.cameraLookAt);
    rig.parallaxTertiary();
    rig.tertiaryCamera.updateMatrixWorld();
  };
}

export class FortEnergyPage extends Page {
  constructor() {
    super("FortEnergy", { camera: { withCurve: true }, scene: { cloudsVisible: false, mountainsVisible: true, skyVisible: true, flaresVisible: false } }, PAGE_MANIFESTS.FortEnergy);
  }

  protected createChapters() {
    return {
      Hero: new FortEnergyHero("Hero", "FortEnergy"),
      FortEnergyChapter: new FortEnergyChapter("FortEnergyChapter", "FortEnergy"),
    };
  }

  protected loaded() {
    const model = this.assets!.get("fortEnergy");
    replaceMaterials(model);
    model.traverse((o) => {
      if ((o as THREE.Mesh).material) o.renderOrder = 10;
    });
    const cylinder = model.getObjectByName("EnergyCylinder") as UniformMesh;
    cylinder.material.uniforms = {
      ...cylinder.material.uniforms,
      iSteps: { value: 2 },
      uSpeed: { value: 0.08 },
      uHeadLength: { value: 0.1 },
      uLineCount: { value: 30 },
      uOpacity: { value: 0.5 },
    };
    const reflected = model.getObjectByName("Reflected")!.clone();
    reflected.scale.y = -1;
    this.env.add(reflected);
    this.env.add(model);
  }

  beforeEnter() {
    super.beforeEnter();
    engine().mainScene.add(this.env);
  }

  afterLeave() {
    super.afterLeave();
    engine().mainScene.remove(this.env);
  }
}
