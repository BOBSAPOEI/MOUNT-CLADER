import * as THREE from "three";
import { CapitalBackgroundMaterial, CapitalForegroundMaterial } from "./capital";
import { CloudMaterial, LakeMaterial, MountainMaterial, SkyMaterial } from "./core";
import { EnergyBgMaterial, EnergyConeMaterial, GlowMaterial, HologramsMaterial, LineMaterial, PowerLineMaterial } from "./fortEnergy";
import { BoatHomepageMaterial, GovernanceBackgroundMaterial, HomepagePeaksMaterial } from "./homepage";
import { DiffuseCloudMaterial, SeaMaterial, SeaRockMaterial } from "./maritime";
import { PBRMaterial } from "./PBRMaterial";
import { GridMaterial, WireframeMaterial } from "./trading";

type AnyMesh = THREE.Mesh & { isInstancedMesh?: boolean; isSkinnedMesh?: boolean; instanceMatrix?: unknown; instanceApplied?: boolean };
type MaterialCtor = new (params: never, caller: never) => THREE.Material;

/**
 * glTF material name (spaces, dashes, digits and dots stripped) → material class. Unknown standard materials
 * fall back to the custom PBR material; unlit / basic materials are left untouched.
 */
const REGISTRY: Record<string, MaterialCtor> = {
  BoatHomepage: BoatHomepageMaterial,
  CapitalBackground: CapitalBackgroundMaterial,
  CapitalForeground: CapitalForegroundMaterial,
  Cloud: CloudMaterial,
  DiffuseCloud: DiffuseCloudMaterial,
  EnergyBg: EnergyBgMaterial,
  EnergyCone: EnergyConeMaterial,
  Glow: GlowMaterial,
  GovernanceBackground: GovernanceBackgroundMaterial,
  Grid: GridMaterial as unknown as MaterialCtor,
  Holograms: HologramsMaterial,
  HomepagePeaks: HomepagePeaksMaterial,
  Lake: LakeMaterial,
  Line: LineMaterial,
  Mountain: MountainMaterial,
  PBR: PBRMaterial as unknown as MaterialCtor,
  PowerLine: PowerLineMaterial,
  Sea: SeaMaterial,
  SeaRock: SeaRockMaterial,
  Sky: SkyMaterial,
  Wireframe: WireframeMaterial as unknown as MaterialCtor,
};

const STRIP = [" ", "-", /[0-9]/g, "."];
const cache = new Map<string, THREE.Material>();

function cacheKey(mesh: AnyMesh) {
  const m = mesh.material as THREE.MeshStandardMaterial;
  return (
    "" +
    !!mesh.instanceMatrix +
    !!mesh.isSkinnedMesh +
    (m?.name || "") +
    (m?.roughnessMap?.uuid || "") +
    (m?.aoMap?.uuid || "") +
    (m?.map?.uuid || "") +
    (m?.metalnessMap?.uuid || "") +
    (m?.normalMap?.uuid || "") +
    ((mesh.userData.ao as THREE.Texture | undefined)?.uuid || "")
  );
}

function replaceMaterial(mesh: AnyMesh, prefix = "") {
  if (prefix) prefix += "-";
  const source = mesh.material as THREE.MeshStandardMaterial & { isMeshPhysicalMaterial?: boolean };
  if ((!source.isMeshStandardMaterial && !source.isMeshPhysicalMaterial) || source.userData?.keepStandard) return source;
  let name = source.name;
  const full = prefix + name;
  STRIP.forEach((s) => (name = name.replaceAll(s as string, "")));
  const Ctor = REGISTRY[name] || REGISTRY.PBR;
  source.name = full;
  const key = full + cacheKey(mesh);
  if (!cache.has(key)) cache.set(key, new Ctor(source as never, mesh as never));
  mesh.material = cache.get(key)!;
  return mesh.material;
}

/** Applies glTF `extras` (material or node) understood by the original: blending, visible, renderOrder. */
function applyExtra(target: THREE.Object3D | THREE.Material, [key, value]: [string, unknown]) {
  switch (key) {
    case "blending":
      (target as THREE.Material).blending = value as THREE.Blending;
      (target as THREE.Material).depthWrite = false;
      break;
    case "visible":
      target.visible = value !== "false";
      break;
    case "renderOrder":
      (target as THREE.Object3D).renderOrder = ~~(value as number);
      break;
  }
}

/** Swaps every glTF material in `root` for its custom shader material. */
export function replaceMaterials(root: THREE.Object3D | undefined, prefix = "") {
  root?.traverse((o) => {
    const mesh = o as AnyMesh;
    const material = mesh.material as THREE.Material | undefined;
    if (material?.name) replaceMaterial(mesh, prefix);
    const after = mesh.material as THREE.Material | undefined;
    if (after?.userData && Object.keys(after.userData).length) Object.entries(after.userData).forEach((e) => applyExtra(after, e));
    if (o.userData && Object.keys(o.userData).length) Object.entries(o.userData).forEach((e) => applyExtra(o, e));
  });
}

/** Merges sibling meshes that share a geometry into one InstancedMesh (named `instance-<name>`). */
export function instanceDuplicates(root: THREE.Object3D, exclude: string[] = []) {
  const groups: Record<string, AnyMesh[]> = {};
  root.traverse((o) => {
    const mesh = o as AnyMesh;
    const key = mesh.name.replace(".", "");
    groups[key] = [mesh];
    if (mesh.geometry && !mesh.instanceApplied) {
      root.traverse((other) => {
        const m = other as AnyMesh;
        if (mesh.name === m.name || !m.geometry || m.instanceApplied || mesh.parent !== m.parent) return;
        if (mesh.geometry.uuid === m.geometry.uuid) {
          m.instanceApplied = true;
          groups[key].push(m);
        }
      });
    }
    if (groups[key].length <= 1) delete groups[key];
  });
  for (const key in groups) {
    const source = root.getObjectByName(key) as AnyMesh | undefined;
    if (source && !source.isInstancedMesh) {
      if (exclude.includes(source.name)) return;
      const members = groups[key];
      const parent = source.parent;
      const instanced = new THREE.InstancedMesh(source.geometry, source.material, members.length);
      instanced.material = source.material;
      (instanced.material as THREE.Material).userData = (source.material as THREE.Material)?.userData;
      instanced.userData = source.userData;
      instanced.name = `instance-${source.name}`;
      members.forEach((m, i) => {
        m.updateMatrixWorld();
        instanced.setMatrixAt(i, m.matrixWorld);
        m.removeFromParent();
      });
      parent?.add(instanced);
    }
  }
}

export function clearMaterialCache() {
  cache.forEach((m) => m.dispose());
  cache.clear();
}
