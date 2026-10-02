import { STORM_MASK_GLSL } from "./sky/storm";

/**
 * Snowy mountain: the baked homepage lightmap gives the soft snow shading, a triplanar rock normal
 * adds the fine ridges, then distance haze and the cloud deck soften it into the sky.
 */
export const MOUNTAIN_VERT = /* glsl */ `
varying vec3 vPosW;
varying vec3 vNormalW;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPosW = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const MOUNTAIN_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tLightmap, tRockNormal, tRockDiffuse, tNoise;
uniform vec3 uSun, uHaze, uCloud, uLit, uShade;
uniform float uHazeNear, uHazeFar, uDetail, uScale, uOpacity, uFogLow, uFogHigh;
varying vec3 vPosW;
varying vec3 vNormalW;
varying vec2 vUv;

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

// Triplanar luminance of the rock photo, used for the streaks where rock shows through the snow.
float rockLum(vec3 p, vec3 n, float s) {
  vec3 w = pow(abs(n), vec3(4.0));
  w /= (w.x + w.y + w.z);
  vec3 c = texture2D(tRockDiffuse, p.zy * s).rgb * w.x + texture2D(tRockDiffuse, p.xz * s).rgb * w.y + texture2D(tRockDiffuse, p.xy * s).rgb * w.z;
  return dot(c, vec3(0.3, 0.59, 0.11));
}

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uSun);
  float baked = texture2D(tLightmap, vec2(vUv.x, 1.0 - vUv.y)).r;
  float light = smoothstep(0.08, 0.26, baked);

  // Fine relief: only the difference the detail normal makes to the lighting is added.
  vec3 Nd = triplanar(vPosW, N, uScale);
  light += (dot(Nd, L) - dot(N, L)) * 0.3;
  float fine = texture2D(tNoise, vPosW.xz * 0.05).r;
  light += (fine - 0.5) * 0.04;

  vec3 col = mix(uShade, uLit, clamp(light, 0.0, 1.0));

  // Steep faces and gullies show grey-blue rock streaks through the snow.
  float steep = 1.0 - smoothstep(0.5, 0.82, Nd.y + (fine - 0.5) * 0.3);
  float rock = rockLum(vPosW, N, uScale * 0.6);
  float exposed = steep * smoothstep(0.18, 0.42, rock);
  col = mix(col, col * vec3(0.8, 0.86, 0.9), exposed * 0.75);

  float dist = distance(vPosW, cameraPosition);
  col = mix(col, uHaze, smoothstep(uHazeNear, uHazeFar, dist) * 0.85);
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
uniform float uHazeNear, uHazeFar, uOpacity, uFogLow, uFogHigh, uVeil, uBaseFade;
varying vec2 vUv;
varying vec3 vPosW;
varying vec3 vNormalW;

void main() {
  vec3 albedo = texture2D(tMap, vUv).rgb;
  vec3 N = normalize(vNormalW);
  float lit = clamp(dot(N, normalize(uSun)) * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = albedo * mix(uShadow, vec3(1.0), lit) * vec3(0.93, 0.985, 1.02);
  float dist = distance(vPosW, cameraPosition);
  col = mix(col, uHaze, smoothstep(uHazeNear, uHazeFar, dist));
  float deck = 1.0 - smoothstep(uFogLow, uFogHigh, vPosW.y);
  col = mix(col, uCloud, max(deck, uVeil));
  // A peak drawn over the cloud decks dissolves its base into them instead of ending in a cut.
  float base = mix(1.0, 1.0 - deck, uBaseFade);
  gl_FragColor = vec4(col, uOpacity * base);
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

void main() {
  vec2 uv = vUv;
  // Plane-space coordinates: x runs along the bank, y up it. Only low frequencies are used so the
  // banks read as soft billows rather than spray.
  vec2 q = vec2(uv.x * uTile.x, uv.y * uTile.y) * 0.25 + vSeed;
  float t = uTime * 0.004;
  float n1 = texture2D(tPerlin, q * 0.45 + vec2(t, 0.0)).r;
  float n2 = texture2D(tPerlin, q * 0.85 + vec2(-t * 0.7, 0.37)).r;
  float n3 = texture2D(tPerlin, q * 1.5 + vec2(t * 1.3, 0.71)).r;

  // Density grows below the bank's nominal top; billows lift and dent that top.
  float h = uEdge - uv.y;
  float dens = h * 1.9 + (n1 - 0.5) * 1.0 + (n2 - 0.5) * 0.35 + (n3 - 0.5) * 0.06;
  float alpha = smoothstep(-0.02, 0.62, dens);
  alpha *= smoothstep(0.0, 0.26, uv.x) * (1.0 - smoothstep(0.74, 1.0, uv.x));
  alpha *= smoothstep(0.0, 0.2, uv.y) * (1.0 - smoothstep(0.7, 0.97, uv.y));

  // Sunlit billow tops, greying towards the underside of the bank, with soft folds between billows.
  vec3 cLight = vec3(0.955, 0.978, 0.99);
  vec3 cShade = vec3(0.815, 0.855, 0.875);
  float under = 1.0 - smoothstep(0.28, 0.78, uv.y + (n1 - 0.5) * 0.25);
  float fold = smoothstep(0.5, 0.8, n2) * 0.25;
  vec3 col = mix(cLight, cShade, clamp(under * 0.85 + fold, 0.0, 1.0));

  vec2 sUv = gl_FragCoord.xy / uResolution;
  float storm = stormAmount(uChapter, sUv, n1);
  vec3 stormCol = mix(uDark * 1.1, uLight * 0.82, n2 * 0.55);
  col = mix(col, stormCol, storm);

  // Fades out once the camera is well below the decks: seen from the storm their plane edges show.
  float fade = 1.0 - smoothstep(2.42, 2.58, uChapter);
  gl_FragColor = vec4(col, alpha * uOpacity * fade);
}`;
