import { COMMON_GLSL } from "./common";

export const CLOUD_VERT = /* glsl */ `
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

/**
 * Billowy cloud bank on a plane: noise-warped top edge, soft sides and base,
 * bright rim and cooler body, tinted slate during the storm chapter.
 */
export const CLOUD_BANK_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tNoise, tPerlin;
uniform float uTime, uChapter, uOpacity, uEdge;
uniform vec2 uTile;
uniform vec2 uResolution;
uniform vec3 uLight, uDark;
varying vec2 vUv;
varying float vSeed;
${COMMON_GLSL}

float fbm(vec2 p) {
  float s = texture2D(tPerlin, p).r * 0.62;
  s += texture2D(tPerlin, p * 2.07 + 0.31).r * 0.38;
  return s;
}

void main() {
  vec2 uv = vUv;
  vec2 q = uv * uTile + vSeed;
  float t = uTime * 0.006;
  float n1 = fbm(q * 0.45 + vec2(t, 0.0));
  float n2 = fbm(q * 1.1 + vec2(-t * 0.8, 0.37));
  float n3 = texture2D(tNoise, q * 3.0 + vec2(t * 2.0, 0.0)).r;

  // Cumulus-style density: grows with depth below the nominal top, lumped by low-frequency noise.
  float h = uEdge - uv.y;
  float dens = h * 2.4 + (n1 - 0.5) * 1.5 + (n2 - 0.5) * 0.7 + (n3 - 0.5) * 0.18;
  float alpha = smoothstep(0.0, 0.5, dens);
  alpha *= smoothstep(0.0, 0.16, uv.x) * smoothstep(1.0, 0.84, uv.x) * smoothstep(0.0, 0.12, uv.y);

  // Lit rim near the top of each billow, cooler and greyer deeper inside.
  float inner = smoothstep(0.0, 0.9, dens);
  vec3 cLight = vec3(0.99, 0.993, 1.0);
  vec3 cShade = vec3(0.78, 0.82, 0.87);
  vec3 col = mix(cLight, cShade, inner * (0.35 + 0.55 * n2));

  vec2 sUv = gl_FragCoord.xy / uResolution;
  float storm = stormAmount(uChapter, sUv, n1);
  vec3 stormCol = mix(uDark * 1.1, uLight * 0.82, n2 * 0.55);
  col = mix(col, stormCol, storm);

  // Fades out as the camera dives below the cloud decks and into the globe chapter.
  float fade = 1.0 - smoothstep(3.0, 3.3, uChapter);
  gl_FragColor = vec4(col, alpha * uOpacity * fade);
}`;

/** Wide, stretched cloud streaks used as the storm-chapter backdrop. */
export const CLOUD_STREAK_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tNoise, tPerlin;
uniform float uTime, uChapter, uOpacity;
uniform vec3 uLight, uDark;
varying vec2 vUv;
varying float vSeed;
${COMMON_GLSL}

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
