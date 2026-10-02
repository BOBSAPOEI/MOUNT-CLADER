import { COMMON_GLSL } from "./common";

export const SKY_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`;

/** Full-screen backdrop behind everything: pale overcast sky, storm slate, globe slate, night. */
export const SKY_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tNoise;
uniform float uChapter, uTime, uAspect;
uniform vec3 uLight, uDark, uGlobeBg, uNight;
varying vec2 vUv;
${COMMON_GLSL}

float fbm(vec2 p) {
  float s = texture2D(tNoise, p).r * 0.5;
  s += texture2D(tNoise, p * 2.03 + 0.37).r * 0.3;
  s += texture2D(tNoise, p * 4.1 + 0.81).r * 0.2;
  return s;
}

void main() {
  vec2 uv = vUv;
  vec2 p = vec2(uv.x * uAspect, uv.y);
  float n = fbm(p * 0.45 + vec2(uTime * 0.0015, 0.0));
  float top = smoothstep(0.3, 1.0, uv.y) * (0.5 + 0.9 * n);

  // Overcast: pale near the horizon, greyer and mottled with darker cloud toward the top of the frame.
  vec3 light = mix(uLight, uLight * vec3(0.78, 0.81, 0.86), top);
  float mottle = smoothstep(0.32, 0.72, fbm(p * 0.7 + vec2(0.4, uTime * 0.001))) * smoothstep(0.3, 1.0, uv.y);
  light = mix(light, vec3(0.64, 0.69, 0.75), mottle * 0.7);

  // Storm: slate blue with brighter streaks.
  float storm = stormAmount(uChapter, uv, n);
  vec3 stormCol = mix(uDark * 0.9, uDark * 1.25, fbm(p * vec2(0.6, 2.4) + 3.0) * 0.8);
  vec3 col = mix(light, stormCol, storm);

  // Globe chapter backdrop and the night of the sustainability chapters.
  col = mix(col, uGlobeBg, smoothstep(2.9, 3.1, uChapter));
  col = mix(col, uNight, smoothstep(3.98, 4.14, uChapter));
  gl_FragColor = vec4(col, 1.0);
}`;
