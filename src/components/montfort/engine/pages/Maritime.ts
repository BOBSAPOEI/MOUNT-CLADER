import * as THREE from "three";
import { Chapter, HeroChapter } from "../chapters/Chapter";
import { engine } from "../Engine";
import { Assets } from "../core/Assets";
import { GLOBAL, VIEWPORT } from "../globals";
import { CHAPTER_MANIFESTS, PAGE_MANIFESTS } from "../manifests";
import { BoatMaritimeMaterial, type SeaMaterial, WaterMaterial } from "../materials/maritime";
import { replaceMaterials } from "../materials/registry";
import { Reflector } from "../scene/Reflector";
import { Page } from "./Page";

const M = CHAPTER_MANIFESTS.Maritime;

class MaritimeHero extends HeroChapter {
  constructor(key: string, sceneKey: string) {
    super(key, sceneKey);
    this.cameraMovement.position = new THREE.Vector3(0, 20, -5);
    this.cameraMovement.lookAt = new THREE.Vector3(0, -300, -5);
  }

  enter() {
    super.enter();
    const e = engine();
    e.mainScene.applyPreset(e.page!.preset.scene);
  }

  leave() {
    super.leave();
    engine().mainScene.applyPreset({ cloudsVisible: false, flaresVisible: false, mountainsVisible: false, skyVisible: false });
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.fromTo(GLOBAL.uChapter, { value: 0 }, { value: 1, duration: 1 });
    return tl;
  }
}

/** Top-down tanker sailing across the dark sea, with its wake reacting to the mouse. */
class MaritimeChapter extends Chapter {
  private boat!: THREE.Object3D;

  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.MaritimeChapter, false);
  }

  loaded() {
    this.boat = this.assets!.get("boat");
    const hull = this.boat.getObjectByName("boat") as THREE.Mesh;
    hull.material = new BoatMaritimeMaterial(hull.material as THREE.MeshBasicMaterial);
    const waves = this.boat.getObjectByName("waves") as THREE.Mesh;
    waves.material = new WaterMaterial({
      uniforms: {
        tMap: { value: (waves.material as THREE.MeshBasicMaterial).map },
        tNoise: { value: Assets.get("noise") },
        tNoiseNormal: { value: Assets.get("noiseNormal") },
        uLightPosition: { value: new THREE.Vector3(80, 64, -8) },
        uWaterColor: { value: new THREE.Color("#1a5a75") },
        tMouseComputation: { value: engine().mouseComputation?.texture ?? null },
        uResolution: VIEWPORT.uResolution,
        uChapter: GLOBAL.uChapter,
        uTime: GLOBAL.uTime,
      },
      depthTest: false,
      transparent: true,
    });
    this.boat.rotation.x = -Math.PI * 0.5;
    this.add(this.boat);
  }

  createScrollTimeline() {
    const tl = super.createScrollTimeline();
    tl.fromTo(this.boat.position, { y: -50 }, { y: 5 }, 0);
    tl.fromTo(this.boat.position, { z: 25 }, { z: 50 }, 0);
    tl.fromTo(this.boat.rotation, { y: -Math.PI * 0.75 }, { y: -Math.PI * 0.5, ease: "power2.inOut" }, 0);
    tl.fromTo(this.boat.rotation, { x: -Math.PI * 0.5 }, { x: -Math.PI * 0.45 }, 0);
    return tl;
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.to(GLOBAL.uChapter, { value: 2, duration: 1 });
    return tl;
  }
}

export class MaritimePage extends Page {
  private maritimeEnv?: THREE.Object3D;

  constructor() {
    super("Maritime", { camera: { withCurve: true }, scene: { cloudsVisible: false, mountainsVisible: true, skyVisible: true, flaresVisible: false, env: "maritime" } }, PAGE_MANIFESTS.Maritime);
  }

  protected createChapters() {
    return {
      Hero: new MaritimeHero("Hero", "Maritime"),
      MaritimeChapter: new MaritimeChapter("MaritimeChapter", "Maritime"),
    };
  }

  protected loaded() {
    const a = this.assets!;
    const rock = a.get<THREE.Texture>("rock");
    const grass = a.get<THREE.Texture>("grass");
    const lightmap = a.get<THREE.Texture>("maritimeLightmap");
    this.mountainsConfig = {
      envMapIntensity: 1,
      envMapRotation: new THREE.Euler(0, 4, 0),
      ambient: new THREE.Color(0xbeccd2),
      ambientIntensity: 0.3,
      roughness: 1,
      color: new THREE.Color(0x948f8c),
      armMap: lightmap,
      map: rock,
      mapTransformRepeat: new THREE.Vector2(12, 16),
      mapTransformOffset: new THREE.Vector2(-5, -5),
      mapTransformRotation: (190 * Math.PI) / 180,
      map2: grass,
      map2TransformRepeat: new THREE.Vector2(10, 10),
      map2TransformOffset: new THREE.Vector2(0, 0),
      map2TransformRotation: 0,
      fogNear: 0.01,
      fogFar: 35,
    };
    const env = a.get("maritime");
    replaceMaterials(env);
    const seaSource = env.getObjectByName("Sea") as THREE.Mesh<THREE.BufferGeometry, SeaMaterial>;
    seaSource.removeFromParent();
    const sea = new Reflector(new THREE.PlaneGeometry(600, 600), seaSource.material, { lightmap });
    sea.rotateX(Math.PI);
    sea.position.copy(seaSource.position);
    env.add(sea);
    rock.wrapS = rock.wrapT = THREE.RepeatWrapping;
    grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
    this.maritimeEnv = env;
  }

  beforeEnter() {
    super.beforeEnter();
    if (this.maritimeEnv) engine().mainScene.mountains.attach(this.maritimeEnv);
  }

  afterLeave() {
    super.afterLeave();
    if (this.maritimeEnv) engine().mainScene.mountains.remove(this.maritimeEnv);
  }
}
