import * as THREE from "three";
import { fragmentShader, vertexShader } from "../shaders/PBR";
import { engine } from "../Engine";

type ParamValue = unknown;
type Params = Record<string, ParamValue>;
type Ctor = new () => unknown;

/** UV transform of one textured slot (`<name>Transform`), mirrored into the `u<Name>Transform` uniform. */
export interface UvTransform {
  repeat: THREE.Vector2;
  offset: THREE.Vector2;
  center: THREE.Vector2;
  rotation: number;
  matrix: THREE.Matrix3;
  update(): UvTransform;
}

const GENERIC_PROPS = [
  "alphaHash", "alphaTest", "alphaToCoverage", "blendAlpha", "blendColor", "blendDst", "blendDstAlpha", "blendEquation",
  "blendEquationAlpha", "blendSrc", "blendSrcAlpha", "blending", "colorWrite", "defines", "depthFunc", "depthTest",
  "depthWrite", "dithering", "forceSinglePass", "format", "name", "opacity", "polygonOffset", "side", "stencilFail",
  "stencilFunc", "stencilFuncMask", "stencilRef", "stencilWrite", "stencilWriteMask", "stencilZFail", "stencilZPass",
  "toneMapped", "transparent", "userData", "vertexColors", "visible",
];

export const CONFIG_TYPES_MAPPING: Record<string, Ctor> = {
  color: THREE.Color,
  emissive: THREE.Color,
  ambient: THREE.Color,
  normalScale: THREE.Vector2,
  envMapRotation: THREE.Euler,
  ...Object.fromEntries(
    ["map", "aoMap", "armMap", "emissiveMap", "normalMap"].flatMap((k) => [
      [`${k}TransformRepeat`, THREE.Vector2],
      [`${k}TransformOffset`, THREE.Vector2],
      [`${k}TransformCenter`, THREE.Vector2],
    ]),
  ),
};

export const PROPS_WITH_UV = ["map", "armMap", "aoMap", "emissiveMap", "normalMap"];

export function filterProps(params: Params, keys: string[]): Params {
  return Object.fromEntries(Object.entries(params).filter(([k]) => keys.includes(k)));
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const isTexture = (v: unknown): v is THREE.Texture => !!(v as THREE.Texture)?.isTexture;
const rotationMatrix = new THREE.Matrix4();

/**
 * Port of the original's custom PBR material. Every parameter is exposed as a property; assigning a value
 * writes the matching uniform (`t<Name>` for textures, `u<Name>` otherwise), and textures also switch on a
 * `SIXTY_<NAME>` define plus a UV transform for the slots listed in `propsWithUV`.
 */
export class PBRMaterial extends THREE.ShaderMaterial {
  readonly isPBRMaterial = true;
  params: Params;
  defaultsParams: Params;
  readonly propsWithUV: string[];
  readonly configTypesMapping: Record<string, Ctor>;
  readonly transforms: Record<string, UvTransform> = {};
  private readonly values: Params = {};

  constructor(params: Params = {}, readonly caller: THREE.Object3D | null = null, extraDefaults: Params = {}, typesMapping = CONFIG_TYPES_MAPPING, propsWithUV = PROPS_WITH_UV) {
    super(filterProps(params, GENERIC_PROPS) as THREE.ShaderMaterialParameters);
    this.configTypesMapping = typesMapping;
    this.propsWithUV = propsWithUV;
    PBRMaterial.normalizeParams(params, typesMapping);
    this.type = "PBRMaterial";
    this.side = THREE.FrontSide;

    const defaults: Params = {
      color: new THREE.Color(0xffffff),
      metalness: 0,
      roughness: 1,
      map: null,
      emissive: new THREE.Color(0),
      emissiveMap: null,
      ambient: new THREE.Color(0xffffff),
      ambientIntensity: 1,
      armMap: null,
      aoMap: null,
      metalnessMapIntensity: 1,
      roughnessMapIntensity: 1,
      aoMapIntensity: 1,
      normalScale: new THREE.Vector2(1, 1),
      normalMap: null,
      envMap: engine().mainScene.environment,
      envMapIntensity: 1,
      envMapRotation: new THREE.Euler(),
      alphaMap: null,
      alphaTest: 0,
      opacity: 1,
      ...extraDefaults,
    };
    this.defaultsParams = defaults;
    this.params = params;
    this.setDefaults(defaults);
    this.applyParams(filterProps(params, Object.keys(defaults)));
    this.armAsAo = isTexture(params.armMap) && isTexture(params.aoMap) && params.armMap === params.aoMap;
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
  }

  set armAsAo(on: boolean) {
    if (on) this.defines.SIXTY_ARM_AS_AO = 1;
    else delete this.defines.SIXTY_ARM_AS_AO;
    this.needsUpdate = true;
  }

  get armAsAo() {
    return Object.hasOwn(this.defines, "SIXTY_ARM_AS_AO");
  }

  /** Current value of a parameter. */
  get<T = unknown>(name: string): T {
    return this.values[name] as T;
  }

  /** Assigns a parameter (same effect as the original's generated property setters). */
  set(name: string, value: ParamValue) {
    this.values[name] = value;
    this.writeUniform(name, value, this.propsWithUV.includes(name));
  }

  transform(name: string): UvTransform {
    return this.transforms[name];
  }

  /**
   * Every default becomes an own accessor property (as on the original), so the renderer sees e.g.
   * `material.envMap` — that is what makes three.js emit the CUBEUV_* defines the PBR shader samples with.
   */
  private setDefaults(defaults: Params) {
    for (const key in defaults) {
      const value = defaults[key];
      if (key === "envMapRotation") {
        const matrix = new THREE.Matrix3();
        this.writeUniform("envMapRotation", matrix);
        this.values.envMapRotation = value;
        Object.defineProperty(this, key, { configurable: true, enumerable: true, get: () => this.values.envMapRotation });
        this.syncEnvMapRotation();
      } else {
        Object.defineProperty(this, key, {
          configurable: true,
          enumerable: true,
          get: () => this.values[key],
          set: (v: ParamValue) => this.set(key, v),
        });
        this.set(key, value);
      }
    }
  }

  private syncEnvMapRotation() {
    const euler = this.values.envMapRotation as THREE.Euler;
    (this.uniforms.uEnvMapRotation.value as THREE.Matrix3).setFromMatrix4(rotationMatrix.makeRotationFromEuler(euler));
  }

  applyParams(params: Params) {
    for (const key in params) {
      const next = params[key];
      if (next === undefined) continue;
      if (!(key in this.values)) continue;
      const current = this.values[key] as { isColor?: boolean; isVector2?: boolean; isVector3?: boolean; isEuler?: boolean; set?(v: unknown): void; copy?(v: unknown): void } | null;
      const n = next as { isColor?: boolean; isVector2?: boolean; isVector3?: boolean; isEuler?: boolean };
      if (current?.isColor && n?.isColor) current.set?.(next);
      else if ((current?.isVector3 && n?.isVector3) || (current?.isVector2 && n?.isVector2) || (current?.isEuler && n?.isEuler)) {
        current.copy?.(next);
        if (key === "envMapRotation") this.syncEnvMapRotation();
      } else if (next != null) this.set(key, next);
    }
  }

  /** Writes `value` into its uniform, creating it (and the texture define / UV transform) on first use. */
  writeUniform(name: string, value: ParamValue, withUv = false) {
    if (value == null) return;
    const uniform = (isTexture(value) ? "t" : "u") + capitalize(name);
    if (this.uniforms[uniform]) {
      this.uniforms[uniform].value = value;
      return;
    }
    if (isTexture(value)) {
      const define = `SIXTY_${name.toUpperCase()}`;
      this.defines[define] = 1;
      if (withUv) {
        this.defines[`${define}_UV`] = this.uvAttribute(value.channel);
        this.transforms[name] = this.createTransform(name);
      }
    }
    this.uniforms[uniform] = { value };
    this.needsUpdate = true;
  }

  private uvAttribute(channel: number) {
    if (channel === 0) {
      this.defines.USE_UV = 1;
      return "uv";
    }
    return `uv${channel}`;
  }

  private createTransform(name: string): UvTransform {
    const texture = this.params[name] as THREE.Texture;
    const repeat = new THREE.Vector2();
    const offset = new THREE.Vector2();
    const center = new THREE.Vector2();
    const r = this.params[`${name}TransformRepeat`] as THREE.Vector2 | undefined;
    const o = this.params[`${name}TransformOffset`] as THREE.Vector2 | undefined;
    const c = this.params[`${name}TransformCenter`] as THREE.Vector2 | undefined;
    const rot = this.params[`${name}TransformRotation`] as number | undefined;
    repeat.set(r?.x || texture.repeat.x, r?.y || texture.repeat.y);
    offset.set(o?.x || texture.offset.x, o?.y || texture.offset.y);
    center.set(c?.x || texture.center.x, c?.y || texture.center.y);
    this.params[`${name}TransformRepeat`] = repeat;
    this.params[`${name}TransformOffset`] = offset;
    this.params[`${name}TransformCenter`] = center;
    this.params[`${name}TransformRotation`] = rot || texture.rotation;
    const matrix = new THREE.Matrix3();
    this.writeUniform(`${name}Transform`, matrix);
    const transform: UvTransform = {
      repeat,
      offset,
      center,
      rotation: (rot || texture.rotation) as number,
      matrix,
      update() {
        this.matrix.setUvTransform(this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y);
        return this;
      },
    };
    return transform.update();
  }

  /** Converts plain arrays / strings in a parameter object to their three.js types. */
  static normalizeParams(params: Params, types: Record<string, Ctor>) {
    for (const [key, Type] of Object.entries(types)) {
      const v = params[key];
      if (v === undefined || v instanceof Type) continue;
      if (Array.isArray(v)) params[key] = (new Type() as { fromArray(a: number[]): unknown }).fromArray(v as number[]);
      else if (typeof v === "string" && Type === THREE.Color) params[key] = new THREE.Color(v);
    }
    params.armMap = params.armMap || params.metalnessMap || params.roughnessMap || null;
    delete params.metalnessMap;
    delete params.roughnessMap;
  }
}
