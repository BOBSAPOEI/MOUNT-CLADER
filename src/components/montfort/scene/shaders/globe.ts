/**
 * Globe: a photographic earth graded into the brand's navy palette. The source texture holds a
 * colour map in RGB and cloud cover in alpha. Sea is rendered glossy (it catches the sun), land
 * dark and matte, with white clouds and a bright limb.
 */
export const GLOBE_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalV;
varying vec3 vViewDir;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormalV = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

export const GLOBE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tData, tNoise;
uniform vec3 uSunV, uSea, uAmbient, uLand, uRim;
uniform float uOpacity, uTime;
varying vec2 vUv;
varying vec3 vNormalV;
varying vec3 vViewDir;

void main() {
  vec4 d = texture2D(tData, vec2(vUv.x, 1.0 - vUv.y));
  vec3 N = normalize(vNormalV);
  vec3 V = normalize(vViewDir);
  vec3 L = normalize(uSunV);

  float ndl = dot(N, L);
  float diffuse = smoothstep(-0.2, 0.85, ndl);
  float ndv = max(dot(N, V), 0.0);

  float sea = smoothstep(0.015, 0.1, d.b - max(d.r, d.g));
  float glint = pow(max(dot(reflect(-L, N), V), 0.0), 10.0);
  vec3 seaCol = uSea + uAmbient * 0.7 + vec3(0.5, 0.64, 0.78) * (glint * 0.85 + 0.22 * diffuse);

  float lum = dot(d.rgb, vec3(0.3, 0.59, 0.11));
  vec3 landCol = uLand * (0.45 + lum * 1.7) * (0.4 + 0.6 * diffuse);
  vec3 col = mix(landCol, seaCol, sea);

  float cloud = d.a * (0.8 + 0.2 * texture2D(tNoise, vUv * 6.0 + uTime * 0.0004).r);
  col = mix(col, vec3(0.88, 0.92, 0.95) * (0.5 + 0.5 * diffuse), cloud * 0.8);

  col += uRim * pow(1.0 - ndv, 3.0) * 0.5;
  gl_FragColor = vec4(col, uOpacity);
}`;

export const GLOW_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uGlow;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vNormalV;
varying vec3 vViewDir;
void main() {
  float rim = pow(1.0 - max(dot(normalize(vNormalV), normalize(vViewDir)), 0.0), 3.2);
  gl_FragColor = vec4(uGlow, rim * 0.9 * uOpacity);
}`;
