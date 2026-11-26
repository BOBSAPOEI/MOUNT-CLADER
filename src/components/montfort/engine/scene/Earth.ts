import * as THREE from "three";
import { engine } from "../Engine";
import { Assets } from "../core/Assets";
import { GLOBAL, VIEWPORT } from "../globals";
import { EarthGlowMaterial, EarthMaterial } from "../materials/homepage";

export interface EarthOptions {
  sun: { position: THREE.Vector3 };
  data: THREE.Texture;
  radius: number;
}

interface Point {
  el: HTMLElement;
  object: THREE.Object3D;
  projectedPosition: THREE.Vector3;
}

const DEG = Math.PI / 180;

/**
 * Globe of "Global connectivity": surface and atmosphere spheres rendered through the secondary (narrow FOV)
 * camera, plus the DOM city labels it projects onto the screen every frame.
 */
export class Earth extends THREE.Object3D {
  readonly inner: THREE.Mesh;
  readonly glow: THREE.Mesh;
  private points?: Point[];
  private readonly worldPosition = new THREE.Vector3();

  constructor(private readonly options: EarthOptions) {
    super();
    const geometry = new THREE.SphereGeometry(options.radius, 64, 64);
    this.inner = new THREE.Mesh(geometry, this.createInnerMaterial(options));
    this.inner.frustumCulled = false;
    this.glow = new THREE.Mesh(geometry, this.createGlowMaterial(options));
    this.glow.frustumCulled = false;
    this.glow.scale.setScalar(1.02);
    this.add(this.inner, this.glow);
    this.update();
  }

  private createInnerMaterial(o: EarthOptions) {
    o.data.wrapS = o.data.wrapT = THREE.RepeatWrapping;
    o.data.colorSpace = THREE.LinearSRGBColorSpace;
    const secondary = engine().camera.secondaryCamera;
    return new EarthMaterial({
      uniforms: {
        tData: { value: o.data },
        tGrain: { value: engine().noise.texture },
        tNoise: { value: Assets.get("noise") },
        uSunPosition: { value: o.sun.position },
        uChapter: GLOBAL.uChapter,
        uEarthSpecular: { value: 0.16 },
        uSeaSpecular: { value: 0.32 },
        uEarthShininess: { value: 0.1 },
        uSeaShininess: { value: 0.2 },
        uCloudsColor: { value: new THREE.Color("#ffffff") },
        uRimColor: { value: new THREE.Color("#8f9c9f") },
        uSeaColor: { value: new THREE.Color("#082233") },
        uEarthTint: { value: new THREE.Color("#000000") },
        uAmbientColor: { value: new THREE.Color("#085069") },
        tMouseComputation: { value: engine().mouseComputation?.texture ?? null },
        uResolution: VIEWPORT.uResolution,
        uTime: GLOBAL.uTime,
        secondaryProjectionMatrix: { value: secondary.projectionMatrix },
        secondaryViewMatrix: { value: secondary.matrixWorldInverse },
      },
    });
  }

  private createGlowMaterial(o: EarthOptions) {
    const secondary = engine().camera.secondaryCamera;
    return new EarthGlowMaterial({
      uniforms: {
        uSunPosition: { value: o.sun.position },
        uGlowColor: { value: new THREE.Color("#f4f6fb") },
        secondaryProjectionMatrix: { value: secondary.projectionMatrix },
        secondaryViewMatrix: { value: secondary.matrixWorldInverse },
      },
      transparent: true,
    });
  }

  coordinatesToVector3(latitude: number, longitude: number) {
    const lat = latitude * DEG;
    const lng = Math.PI * 0.5 + longitude * DEG;
    return new THREE.Vector3(Math.cos(lat) * Math.sin(lng), Math.sin(lat), Math.cos(lat) * Math.cos(lng)).multiplyScalar(this.options.radius);
  }

  /** Projects the city labels; a label shows only while its point faces the camera. */
  update() {
    this.inner.getWorldPosition(this.worldPosition);
    const camera = engine().camera.secondaryCamera;
    const { width, height } = engine().viewport;
    this.points?.forEach(({ el, object, projectedPosition: p }) => {
      object.getWorldPosition(p);
      el.classList.toggle("visible", p.distanceTo(camera.position) < this.worldPosition.distanceTo(camera.position));
      p.project(camera).multiplyScalar(0.5).addScalar(0.5);
      p.set(p.x * width, (1 - p.y) * height, 0);
      el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    });
  }

  setPoints(elements?: HTMLElement[]) {
    if (!elements) return;
    this.points?.forEach(({ object }) => object.removeFromParent());
    this.points = elements.map((el) => {
      const object = new THREE.Object3D();
      object.position.copy(this.coordinatesToVector3(parseFloat(el.dataset.latitude ?? "0"), parseFloat(el.dataset.longitude ?? "0")));
      this.inner.add(object);
      return { el, object, projectedPosition: new THREE.Vector3() };
    });
  }
}
