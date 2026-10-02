import * as THREE from "three";
import { engine } from "../Engine";
import { GLOBAL, LAYER_MOUNTAIN } from "../globals";
import { LakeMaterial, MaritimeSimpleMaterial } from "../materials/core";

/**
 * Planar reflector (Capital lake, Maritime sea). Re-renders only the mountain layer from the mirrored camera
 * into a small shared render target. With a `surface` material (the sea) the mountain is drawn with a cheap
 * lightmap-only material during the reflection pass.
 */
export class Reflector extends THREE.Mesh {
  static renderTarget: THREE.WebGLRenderTarget | null = null;
  readonly isReflector = true;
  readonly renderTexture: THREE.Texture;
  readonly reflectorTextureMatrix = new THREE.Matrix4();
  private readonly mirrorCamera = new THREE.PerspectiveCamera();
  private readonly oldBackground = new THREE.Color();
  private readonly swapMountain: boolean;
  private readonly simpleMountainMaterial?: MaritimeSimpleMaterial;
  private oldMountainMaterial: THREE.Material | THREE.Material[] | null = null;

  constructor(geometry: THREE.BufferGeometry, surface?: THREE.ShaderMaterial, options: { clipBias?: number; lightmap?: THREE.Texture } = {}) {
    super(geometry);
    if (!Reflector.renderTarget) {
      const size = engine().viewport.breakpoint === "mobile" ? 128 : 256;
      Reflector.renderTarget = new THREE.WebGLRenderTarget(size, size, { samples: 2 });
    }
    this.rotateX(Math.PI * 0.5);
    const rt = Reflector.renderTarget;
    this.renderTexture = rt.texture;
    const clipBias = options.clipBias || 0;
    const textureMatrix = this.reflectorTextureMatrix;
    this.swapMountain = !!surface;
    if (surface) {
      this.simpleMountainMaterial = new MaritimeSimpleMaterial(options.lightmap!);
      surface.uniforms.tDiffuse = { value: rt.texture };
      surface.uniforms.textureMatrix = { value: textureMatrix };
      this.material = surface;
    } else {
      const lake = new LakeMaterial();
      lake.uniforms.tDiffuse = { value: rt.texture };
      lake.uniforms.textureMatrix = { value: textureMatrix };
      this.material = lake;
    }

    const plane = new THREE.Plane();
    const normal = new THREE.Vector3();
    const reflectorWorld = new THREE.Vector3();
    const cameraWorld = new THREE.Vector3();
    const rotation = new THREE.Matrix4();
    const lookAtPosition = new THREE.Vector3(0, 0, -1);
    const clipPlane = new THREE.Vector4();
    const view = new THREE.Vector3();
    const target = new THREE.Vector3();
    const q = new THREE.Vector4();
    const camera = this.mirrorCamera;

    this.onBeforeRender = (renderer, scene, cam) => {
      reflectorWorld.setFromMatrixPosition(this.matrixWorld);
      cameraWorld.setFromMatrixPosition(cam.matrixWorld);
      rotation.extractRotation(this.matrixWorld);
      normal.set(0, 0, 1).applyMatrix4(rotation);
      view.subVectors(reflectorWorld, cameraWorld);
      view.reflect(normal).negate();
      view.add(reflectorWorld);
      rotation.extractRotation(cam.matrixWorld);
      lookAtPosition.set(0, 0, -1).applyMatrix4(rotation);
      lookAtPosition.add(cameraWorld);
      target.subVectors(reflectorWorld, lookAtPosition);
      target.reflect(normal).negate();
      target.add(reflectorWorld);
      camera.position.copy(view);
      camera.up.set(0, -1, 0).applyMatrix4(rotation).reflect(normal);
      camera.lookAt(target);
      camera.far = (cam as THREE.PerspectiveCamera).far;
      camera.updateMatrixWorld();
      camera.projectionMatrix.copy(cam.projectionMatrix);
      textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
      textureMatrix.multiply(camera.projectionMatrix);
      textureMatrix.multiply(camera.matrixWorldInverse);
      textureMatrix.multiply(this.matrixWorld);
      plane.setFromNormalAndCoplanarPoint(normal, reflectorWorld);
      plane.applyMatrix4(camera.matrixWorldInverse);
      clipPlane.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
      const p = camera.projectionMatrix;
      q.x = (Math.sign(clipPlane.x) + p.elements[8]) / p.elements[0];
      q.y = (Math.sign(clipPlane.y) + p.elements[9]) / p.elements[5];
      q.z = -1;
      q.w = (1 + p.elements[10]) / p.elements[14];
      clipPlane.multiplyScalar(2 / clipPlane.dot(q));
      p.elements[2] = clipPlane.x;
      p.elements[6] = clipPlane.y;
      p.elements[10] = clipPlane.z + 1 - clipBias;
      p.elements[14] = clipPlane.w;

      const background = scene.background as THREE.Color;
      this.oldBackground.copy(background);
      const mountain = engine().mainScene.mountains.mountain;
      if (this.swapMountain) {
        this.oldMountainMaterial = mountain.material;
        mountain.material = this.simpleMountainMaterial!;
      }
      background.copy(GLOBAL.uLightColor.value);
      this.visible = false;
      camera.layers.disableAll();
      camera.layers.enable(LAYER_MOUNTAIN);
      const current = renderer.getRenderTarget();
      const xr = renderer.xr.enabled;
      const shadowAuto = renderer.shadowMap.autoUpdate;
      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(rt);
      renderer.state.buffers.depth.setMask(true);
      if (renderer.autoClear === false) renderer.clear();
      renderer.render(scene, camera);
      renderer.xr.enabled = xr;
      renderer.shadowMap.autoUpdate = shadowAuto;
      renderer.setRenderTarget(current);
      const viewport = (cam as THREE.PerspectiveCamera & { viewport?: THREE.Vector4 }).viewport;
      if (viewport !== undefined) renderer.state.viewport(viewport);
      this.visible = true;
      background.copy(this.oldBackground);
      if (this.swapMountain && this.oldMountainMaterial) mountain.material = this.oldMountainMaterial;
    };
  }

  dispose() {
    (this.material as THREE.Material).dispose();
  }
}
