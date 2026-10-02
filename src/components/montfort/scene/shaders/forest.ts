/** Forest backdrop planes (blurred photo atlas) and drifting dust particles for the night chapters. */
export const FOREST_VERT = /* glsl */ `
varying vec2 vUv;
varying vec2 vLocal;
void main() {
  vUv = uv;
  vLocal = position.xz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const FOREST_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform float uOpacity, uBlur, uBrightness, uTime, uFeather;
uniform vec3 uTint;
uniform vec4 uBounds;
varying vec2 vUv;
varying vec2 vLocal;

void main() {
  vec2 uv = vUv;
  uv.x += sin(uv.y * 6.0 + uTime * 0.25) * 0.0015;
  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      float w = 1.0 / (1.0 + float(i * i + j * j));
      acc += texture2D(tMap, uv + vec2(float(i), float(j)) * uBlur) * w;
      wsum += w;
    }
  }
  acc /= wsum;
  vec3 col = acc.rgb * uBrightness * uTint;
  // The tree cut-outs are trimmed planes whose foliage runs up to the border; feather the border
  // so the plane outline never shows as a hard rectangle.
  vec2 lo = smoothstep(uBounds.xy, uBounds.xy + uFeather, vLocal);
  vec2 hi = 1.0 - smoothstep(uBounds.zw - uFeather, uBounds.zw, vLocal);
  float edge = lo.x * lo.y * hi.x * hi.y;
  gl_FragColor = vec4(col, acc.a * uOpacity * edge);
}`;

export const DUST_VERT = /* glsl */ `
uniform float uSize, uTime, uDpr;
attribute float aSeed;
varying float vTwinkle;
void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.2 + aSeed * 40.0) * 1.2;
  p.x += cos(uTime * 0.13 + aSeed * 30.0) * 1.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uDpr * (80.0 / -mv.z);
  vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 60.0);
}`;

export const DUST_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vTwinkle;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, d);
  gl_FragColor = vec4(uColor, a * a * uOpacity * vTwinkle);
}`;
