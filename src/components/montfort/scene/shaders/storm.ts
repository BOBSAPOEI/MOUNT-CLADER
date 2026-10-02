import { STORM_MASK_GLSL } from "./sky/storm";

export const STREAK_VERT = /* glsl */ `
varying vec2 vUv;
varying float vSeed;
void main() {
  vUv = uv;
  vec4 p = vec4(position, 1.0);
  vSeed = 0.0;
  #ifdef USE_INSTANCING
  p = instanceMatrix * p;
  vSeed = instanceMatrix[3][0] * 0.013 + instanceMatrix[3][1] * 0.017 + instanceMatrix[3][2] * 0.011;
  #endif
  gl_Position = projectionMatrix * modelViewMatrix * p;
}`;

/** Wide, stretched cloud streaks used as the storm-chapter backdrop. */
export const CLOUD_STREAK_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tNoise, tPerlin;
uniform float uTime, uChapter, uOpacity;
uniform vec3 uLight, uDark;
varying vec2 vUv;
varying float vSeed;
${STORM_MASK_GLSL}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.004;
  vec2 q = vec2(uv.x * 1.6, uv.y * 7.0);
  float a = texture2D(tPerlin, q * vec2(0.5, 0.35) + vec2(t, 0.0)).r;
  float b = texture2D(tNoise, q * vec2(0.9, 0.5) + vec2(-t * 1.4, 0.2)).r;
  float c = texture2D(tPerlin, q * vec2(1.7, 1.1) + vec2(t * 0.5, 0.6)).r;
  float streak = smoothstep(0.38, 0.78, a * 0.6 + b * 0.4);
  float mask = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.82, uv.x) * smoothstep(0.0, 0.18, uv.y) * smoothstep(1.0, 0.82, uv.y);
  vec3 col = mix(uDark * 1.05, uLight * 0.9, streak * (0.55 + 0.45 * c));
  float storm = smoothstep(2.1, 2.5, uChapter) * (1.0 - smoothstep(2.85, 3.05, uChapter));
  gl_FragColor = vec4(col, streak * mask * 0.95 * uOpacity * storm);
}`;

/** Textured sprite plane (boat) with a chapter-driven fade and cool tint. */
export const SPRITE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const BOAT_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform float uOpacity;
uniform vec3 uTint;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(tMap, vUv);
  gl_FragColor = vec4(t.rgb * uTint, t.a * uOpacity);
}`;
