import * as THREE from "three";
import { GLOBAL, PAGES } from "../globals";

/** CatmullRom curve through a path mesh's vertices (reversed, as authored in Blender). */
export function curveFromGeometry(geometry: THREE.BufferGeometry, origin = new THREE.Vector3()) {
  const array = geometry.getAttribute("position").array;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < array.length; i += 3) points.push(new THREE.Vector3(array[i], array[i + 1], array[i + 2]).sub(origin));
  points.reverse();
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

export interface CameraPreset {
  position?: THREE.Vector3;
  lookAt?: THREE.Vector3;
  withCurve?: boolean;
}

const DEFAULT_PRESET: Required<CameraPreset> = { position: new THREE.Vector3(0, 0, 100), lookAt: new THREE.Vector3(0, 0, 0), withCurve: true };

/**
 * Main camera: sits on the mountains' `CameraPath` at the page index, looks at the matching point of
 * `TargetPath`, adds the hero's scroll offsets and a subtle mouse parallax.
 */
export class CameraRig extends THREE.PerspectiveCamera {
  readonly targetPosition = new THREE.Vector3();
  readonly targetLookAt = new THREE.Vector3();
  readonly navigationTargetLookAt = new THREE.Vector3();
  readonly chapterPosition = new THREE.Vector3();
  readonly chapterLookAt = new THREE.Vector3();
  readonly secondaryCamera: THREE.PerspectiveCamera;
  readonly tertiaryCamera: THREE.PerspectiveCamera;
  parallaxIntensity = 1;
  navigating = false;
  private curve?: THREE.CatmullRomCurve3;
  private lookAtPoints: THREE.Vector3[] = [];
  private lookAtPointsMobile: THREE.Vector3[] = [];
  private progress = 0;
  private readonly lerpedMouse = new THREE.Vector2();
  private readonly lookAtSum = new THREE.Vector3();

  constructor(ratio: number, private readonly isMobile: () => boolean) {
    super(55, ratio, 1, 1000);
    this.secondaryCamera = new THREE.PerspectiveCamera(5, ratio, 0.2, 200);
    this.tertiaryCamera = new THREE.PerspectiveCamera(35, ratio, 0.1, 500);
  }

  /** Reads the camera rails out of mountains.glb. */
  setupCurves(mountains: THREE.Object3D) {
    const path = mountains.getObjectByName("CameraPath") as THREE.Mesh | undefined;
    const target = mountains.getObjectByName("TargetPath") as THREE.Mesh | undefined;
    const targetMobile = mountains.getObjectByName("TargetPath-Mobile") as THREE.Mesh | undefined;
    path?.removeFromParent();
    target?.removeFromParent();
    targetMobile?.removeFromParent();
    if (!path || !target || !targetMobile) return;
    this.curve = curveFromGeometry(path.geometry);
    const lookAtCurve = curveFromGeometry(target.geometry);
    this.lookAtPoints = PAGES.map((_, i) => lookAtCurve.getPoint(i / (PAGES.length - 1)));
    const mobileCurve = curveFromGeometry(targetMobile.geometry);
    this.lookAtPointsMobile = PAGES.map((_, i) => mobileCurve.getPoint(i / (PAGES.length - 1)));
  }

  getNavigationLookAt(index: number) {
    return (this.isMobile() ? this.lookAtPointsMobile : this.lookAtPoints)[index];
  }

  set curveProgress(value: number) {
    this.progress = value;
    this.curve?.getPoint(value / 4, this.targetPosition);
    const a = this.getNavigationLookAt(Math.floor(value));
    const b = this.getNavigationLookAt(Math.floor(value) + 1) || a;
    if (a) this.targetLookAt.lerpVectors(a, b, value % 1);
  }

  get curveProgress() {
    return this.progress;
  }

  applyPreset(preset: CameraPreset = {}, pageIndex?: number) {
    const p = { ...DEFAULT_PRESET, ...preset };
    this.chapterPosition.setScalar(0);
    this.chapterLookAt.setScalar(0);
    if (p.withCurve && typeof pageIndex === "number") this.curveProgress = pageIndex;
    else {
      this.targetPosition.copy(p.position);
      this.targetLookAt.copy(p.lookAt);
    }
  }

  update(dt: number, mouse: THREE.Vector2, isTouch: boolean) {
    this.position.copy(this.targetPosition).add(this.chapterPosition);
    this.position.y += GLOBAL.uLongpress.value * 20;
    this.lookAt(this.lookAtSum.addVectors(this.navigating ? this.navigationTargetLookAt : this.targetLookAt, this.chapterLookAt));
    if (isTouch) return;
    this.lerpedMouse.lerp(mouse, dt * 0.5);
    const m = this.lerpedMouse;
    const k = this.parallaxIntensity;
    this.translateX(m.x * 0.1 * k);
    this.translateY(m.y * 0.2 * k);
    this.rotateY(-m.x * 0.05 * k);
    this.rotateX(m.y * 0.05 * k);
    this.secondaryCamera.updateMatrixWorld();
  }

  /** Same parallax applied to the tertiary camera (Fort Energy chapter). */
  parallaxTertiary() {
    const m = this.lerpedMouse;
    const k = this.parallaxIntensity;
    this.tertiaryCamera.translateX(m.x * 0.1 * k);
    this.tertiaryCamera.translateY(m.y * 0.2 * k);
    this.tertiaryCamera.rotateY(-m.x * 0.05 * k);
    this.tertiaryCamera.rotateX(m.y * 0.05 * k);
  }

  resize(ratio: number) {
    for (const cam of [this as THREE.PerspectiveCamera, this.secondaryCamera, this.tertiaryCamera]) {
      cam.aspect = ratio;
      cam.updateProjectionMatrix();
    }
  }
}
