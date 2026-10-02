import { STORM_MASK_GLSL } from "./sky/storm";

/** Snowy mountain: triplanar rock relief, slope-based snow, soft light and distance haze. */
export const MOUNTAIN_VERT = /* glsl */ `
varying vec3 vPosW;
varying vec3 vNormalW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPosW = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const MOUNTAIN_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tRockNormal, tNoise;
uniform vec3 uSun, uHaze, uShadow, uCloud;
uniform float uHazeNear, uHazeFar, uDetail, uScale, uOpacity, uFogLow, uFogHigh;
varying vec3 vPosW;
varying vec3 vNormalW;

// Whiteout-blended triplanar normal mapping.
vec3 triplanar(vec3 p, vec3 n, float s) {
  vec3 w = pow(abs(n), vec3(4.0));
  w /= (w.x + w.y + w.z);
  vec3 tx = texture2D(tRockNormal, p.zy * s).xyz * 2.0 - 1.0;
  vec3 ty = texture2D(tRockNormal, p.xz * s).xyz * 2.0 - 1.0;
  vec3 tz = texture2D(tRockNormal, p.xy * s).xyz * 2.0 - 1.0;
  vec3 nx = vec3(tx.xy * uDetail + n.zy, abs(tx.z) * n.x);
  vec3 ny = vec3(ty.xy * uDetail + n.xz, abs(ty.z) * n.y);
  vec3 nz = vec3(tz.xy * uDetail + n.xy, abs(tz.z) * n.z);
  return normalize(nx.zyx * w.x + ny.xzy * w.y + nz.xyz * w.z);
}

void main() {
  vec3 N = normalize(vNormalW);
  vec3 Nd = triplanar(vPosW, N, uScale);
  float broad = texture2D(tNoise, vPosW.xz * 0.011).r;
  float fine = texture2D(tNoise, vPosW.xz * 0.06 + vPosW.y * 0.01).r;

  float slope = Nd.y;
  float snow = smoothstep(0.30, 0.68, slope * 0.85 + broad * 0.35 + N.y * 0.2);
  vec3 snowCol = vec3(0.955, 0.978, 1.0);
  vec3 rockCol = mix(vec3(0.46, 0.57, 0.67), vec3(0.66, 0.74, 0.80), broad);
  vec3 albedo = mix(rockCol, snowCol, snow) * (0.93 + 0.07 * fine);

  float lit = clamp(dot(Nd, normalize(uSun)) * 0.9 + 0.25, 0.0, 1.0);
  vec3 col = albedo * mix(uShadow, vec3(1.04, 1.04, 1.03), lit);
  col *= 0.82 + 0.18 * smoothstep(-0.3, 0.7, Nd.y);

  float dist = distance(vPosW, cameraPosition);
  col = mix(col, uHaze, smoothstep(uHazeNear, uHazeFar, dist));
  // Everything below the cloud deck dissolves into it; only the summits stay crisp.
  float deck = 1.0 - smoothstep(uFogLow, uFogHigh, vPosW.y);
  col = mix(col, uCloud, deck);
  gl_FragColor = vec4(col, uOpacity);
}`;

/** The three smaller peaks, textured from a baked albedo and hazed the same way. */
export const PEAK_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosW;
varying vec3 vNormalW;
void main() {
  vUv = uv;
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
  #ifdef USE_INSTANCING
  p = instanceMatrix * p;
  n = mat3(instanceMatrix) * n;
  #endif
  vec4 w = modelMatrix * p;
  vPosW = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const PEAK_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec3 uSun, uHaze, uShadow, uCloud;
uniform float uHazeNear, uHazeFar, uOpacity, uFogLow, uFogHigh;
varying vec2 vUv;
varying vec3 vPosW;
varying vec3 vNormalW;

void main() {
  vec3 albedo = texture2D(tMap, vUv).rgb;
  vec3 N = normalize(vNormalW);
  float lit = clamp(dot(N, normalize(uSun)) * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = albedo * mix(uShadow, vec3(1.04), lit) * vec3(0.98, 1.0, 1.03);
  float dist = distance(vPosW, cameraPosition);
  col = mix(col, uHaze, smoothstep(uHazeNear, uHazeFar, dist));
  float deck = 1.0 - smoothstep(uFogLow, uFogHigh, vPosW.y);
  col = mix(col, uCloud, deck);
  gl_FragColor = vec4(col, uOpacity);
}`;

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

export const CLOUD_BANK_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tNoise, tPerlin;
uniform float uTime, uChapter, uOpacity, uEdge;
uniform vec2 uTile;
uniform vec2 uResolution;
uniform vec3 uLight, uDark;
varying vec2 vUv;
varying float vSeed;
${STORM_MASK_GLSL}

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

  // Fades out once the camera is well below the decks: seen from the storm their plane edges show.
  float fade = 1.0 - smoothstep(2.42, 2.58, uChapter);
  gl_FragColor = vec4(col, alpha * uOpacity * fade);
}`;
