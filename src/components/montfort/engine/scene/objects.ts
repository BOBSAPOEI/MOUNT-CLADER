import * as THREE from "three";
import { engine } from "../Engine";
import { Assets } from "../core/Assets";
import { damp, GLOBAL, VIEWPORT } from "../globals";
import { ParticlesMaterial } from "../materials/core";
import { GridMaterial, type GridOptions, HoverParticlesMaterial, WireframeMaterial } from "../materials/trading";

/** Random dust points in a box (halved on phones). */
export class Particles extends THREE.Points {
  constructor(count = 200, size = new THREE.Vector3(10, 40, 30), color = new THREE.Color(0xb6fffb), pointSize = 5) {
    const mobile = engine().viewport.breakpoint === "mobile";
    if (mobile) {
      count /= 2;
      size.z /= 2;
    }
    const positions: number[] = [];
    for (let i = 0; i < count; i++) positions.push(2 * size.x * Math.random() - size.x, 2 * size.y * Math.random() - size.y, 2 * size.z * Math.random() - size.z);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    super(geometry, new ParticlesMaterial(color, pointSize));
    this.frustumCulled = false;
    this.position.y += size.y * 0.5;
  }
}

/** Particles scattered on the Trading hero's invisible raycast surface, pushed around by the pointer. */
export class HoverParticles extends THREE.Mesh<THREE.InstancedBufferGeometry, HoverParticlesMaterial> {
  private readonly raycaster = new THREE.Raycaster();
  private readonly velocity = new THREE.Vector3();

  constructor(private readonly targetMesh: THREE.Mesh) {
    super();
    this.geometry = HoverParticles.createGeometry(targetMesh.geometry);
    this.material = new HoverParticlesMaterial({
      uniforms: {
        uTime: GLOBAL.uTime,
        uLongpress: GLOBAL.uLongpress,
        uChapter: GLOBAL.uChapter,
        uHoverPosition: { value: new THREE.Vector3() },
        uHover: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });
  }

  private static createGeometry(source: THREE.BufferGeometry) {
    const quad = new THREE.PlaneGeometry(1, 2).deleteAttribute("normal");
    const geometry = new THREE.InstancedBufferGeometry();
    const position = source.getAttribute("position");
    geometry.instanceCount = position.count;
    geometry.attributes = quad.attributes;
    geometry.index = quad.index;
    const positions: number[] = [];
    const types: number[] = [];
    for (let i = 0; i < position.count; i++) {
      positions.push(position.getX(i), position.getY(i), position.getZ(i));
      types[i] = Math.floor(Math.random() * 2);
    }
    geometry.setAttribute("aPosition", new THREE.InstancedBufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute("aType", new THREE.InstancedBufferAttribute(new Uint8Array(types), 1));
    return geometry;
  }

  update(dt: number) {
    const u = this.material.uniforms;
    const e = engine();
    this.raycaster.setFromCamera(e.mouse.coordinates.webgl, e.camera);
    const hit = this.raycaster.intersectObject(this.targetMesh, false)[0];
    const hover = u.uHoverPosition.value as THREE.Vector3;
    if (hit) {
      this.velocity.lerp(hit.point.clone().sub(hover), dt * 50);
      u.uHover.value = damp(u.uHover.value as number, 1, 5, dt);
    } else {
      this.velocity.multiplyScalar(0.99);
      u.uHover.value = (u.uHover.value as number) * 0.99;
    }
    hover.add(this.velocity.clone().multiplyScalar(dt));
  }
}

/** Instanced wireframe barrels / metal bars orbiting in the Trading chapter. */
export class WireframeInstances extends THREE.Mesh<THREE.InstancedBufferGeometry, WireframeMaterial> {
  constructor(source: THREE.Mesh, kind: "oil" | "metal", count = 6) {
    super();
    this.material = new WireframeMaterial({
      uniforms: {
        tMap: { value: (source.material as THREE.MeshBasicMaterial).map },
        tNoise: { value: Assets.get("noise") },
        uAccentColor: { value: new THREE.Color("#5797b8") },
        uBackgroundColor: { value: new THREE.Color("#0d3752") },
        uFadeProgress: { value: 0 },
        uTime: GLOBAL.uTime,
        uScrollProgress: GLOBAL.uScrollProgress,
        tMouseComputation: { value: engine().mouseComputation?.texture ?? null },
        uResolution: VIEWPORT.uResolution,
      },
      transparent: true,
      defines: { IS_OIL: kind === "oil", IS_METAL: kind === "metal" },
    });
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.instanceCount = count;
    geometry.attributes = source.geometry.attributes;
    geometry.index = source.geometry.index;
    geometry.setAttribute("aInstanceId", new THREE.InstancedBufferAttribute(new Uint8Array(Array.from({ length: count }, (_, i) => i)), 1));
    this.geometry = geometry;
    this.material.defines.COUNT = count.toFixed(2);
    this.frustumCulled = false;
  }
}

/** Unit quad carrying the grid shader. */
export class GridPlane extends THREE.Mesh<THREE.PlaneGeometry, GridMaterial> {
  static readonly quad = new THREE.PlaneGeometry(1, 1);
  constructor(options: GridOptions = {}) {
    super(GridPlane.quad, new GridMaterial(options));
    this.renderOrder = -10;
  }
}
