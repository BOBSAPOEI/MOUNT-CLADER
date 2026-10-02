import * as THREE from "three";
import { Chapter, HeroChapter } from "../chapters/Chapter";
import { engine } from "../Engine";
import { GLOBAL } from "../globals";
import { CHAPTER_MANIFESTS, PAGE_MANIFESTS } from "../manifests";
import type { CapitalForegroundMaterial } from "../materials/capital";
import { GrassGroundMaterial, GrassPlantsMaterial } from "../materials/capital";
import { instanceDuplicates, replaceMaterials } from "../materials/registry";
import { Reflector } from "../scene/Reflector";
import { Page } from "./Page";

const M = CHAPTER_MANIFESTS.Capital;

class CapitalHero extends HeroChapter {
  constructor(key: string, sceneKey: string) {
    super(key, sceneKey);
    this.cameraMovement.position = new THREE.Vector3(-6, 3, 0);
    this.cameraMovement.lookAt = new THREE.Vector3(0, -300, 0);
  }

  enter() {
    super.enter();
    const e = engine();
    e.mainScene.applyPreset(e.page!.preset.scene);
  }

  leave() {
    super.leave();
    engine().mainScene.applyPreset({ cloudsVisible: false, flaresVisible: true, mountainsVisible: false, skyVisible: false });
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.fromTo(GLOBAL.uChapter, { value: 0 }, { value: 1, duration: 1 }, 0);
    return tl;
  }
}

/** Close-up of the alpine meadow: a grass ground plane with instanced flowers bending under the mouse. */
class CapitalChapter extends Chapter {
  constructor(key: string, sceneKey: string) {
    super(key, sceneKey, M.CapitalChapter, false);
  }

  loaded() {
    const grass = this.assets!.get("grassModel");
    grass.position.z = 12;
    grass.rotateX(-Math.PI * 0.5);
    const light = new THREE.Vector3(0, 10, 0);
    instanceDuplicates(grass);
    grass.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const name = (mesh.material as THREE.Material | undefined)?.name;
      if (name === "GrassGround") mesh.material = new GrassGroundMaterial(light, mesh);
      if (name === "GrassPlants") mesh.material = new GrassPlantsMaterial(light, mesh);
    });
    this.add(grass);
  }

  createNoOverlapScrollTimeline() {
    const tl = super.createNoOverlapScrollTimeline();
    tl.to(GLOBAL.uChapter, { value: 2, duration: 1 }, 0);
    return tl;
  }
}

export class CapitalPage extends Page {
  private lake?: Reflector;

  constructor() {
    super("Capital", { camera: { withCurve: true }, scene: { cloudsVisible: false, mountainsVisible: true, flaresVisible: true, skyVisible: true } }, PAGE_MANIFESTS.Capital);
  }

  protected createChapters() {
    return {
      Hero: new CapitalHero("Hero", "Capital"),
      CapitalChapter: new CapitalChapter("CapitalChapter", "Capital"),
    };
  }

  protected loaded() {
    const a = this.assets!;
    const snow = a.get<THREE.Texture>("snow");
    const grass = a.get<THREE.Texture>("grass");
    snow.wrapS = snow.wrapT = THREE.RepeatWrapping;
    grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
    this.mountainsConfig = {
      envMapIntensity: 1,
      envMapRotation: new THREE.Euler(0, 44, 0),
      ambient: new THREE.Color(0xffffff),
      ambientIntensity: 0.76,
      roughness: 0.95,
      color: new THREE.Color(0xffffff),
      armMap: a.get<THREE.Texture>("capitalLightmap"),
      map: snow,
      mapTransformRepeat: new THREE.Vector2(20, 20),
      mapTransformOffset: new THREE.Vector2(0, 0),
      mapTransformRotation: 0,
      map2: grass,
      map2TransformRepeat: new THREE.Vector2(30, 30),
      map2TransformOffset: new THREE.Vector2(0, 0),
      map2TransformRotation: 0,
      mixMap: a.get<THREE.Texture>("snowRockMix"),
      fogNear: 0.005,
      fogFar: 30,
    };
    this.env.add(a.get("capital"));
    replaceMaterials(this.env);
    this.env.traverse((o) => {
      const material = (o as THREE.Mesh).material as CapitalForegroundMaterial | undefined;
      if (material?.needsGrass) material.uniforms.tGrass.value = grass;
    });
    const prairie = this.env.getObjectByName("capital-prairie") as THREE.Mesh<THREE.BufferGeometry, CapitalForegroundMaterial>;
    this.lake = new Reflector(new THREE.PlaneGeometry(60, 60));
    this.lake.renderOrder = -1;
    prairie.material.uniforms.tReflexion.value = this.lake.renderTexture;
    prairie.material.uniforms.textureMatrix.value = this.lake.reflectorTextureMatrix;
    this.lake.rotateX(Math.PI);
    this.lake.position.copy(this.env.getObjectByName("LakePos")!.position);
    this.env.add(this.lake);
  }

  beforeEnter() {
    super.beforeEnter();
    engine().mainScene.mountains.add(this.env);
  }

  afterLeave() {
    super.afterLeave();
    engine().mainScene.mountains.remove(this.env);
  }
}
