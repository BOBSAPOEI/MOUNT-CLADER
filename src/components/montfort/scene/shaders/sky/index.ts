import { SKY_ALPINE_GLSL } from "./alpine";
import { SKY_COMMON_GLSL } from "./common";
import { SKY_GLOBE_GLSL } from "./globe";
import { SKY_NIGHT_GLSL } from "./night";
import { SKY_STORM_GLSL, STORM_MASK_GLSL } from "./storm";

export const SKY_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`;

/** Full-screen backdrop composed from one chunk per chapter. */
export const SKY_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tNoise;
uniform float uChapter, uTime, uAspect;
uniform vec3 uLight, uDark, uGlobeBg, uNight;
varying vec2 vUv;
${SKY_COMMON_GLSL}
${SKY_ALPINE_GLSL}
${STORM_MASK_GLSL}
${SKY_STORM_GLSL}
${SKY_GLOBE_GLSL}
${SKY_NIGHT_GLSL}

void main() {
  vec2 uv = vUv;
  vec2 p = vec2(uv.x * uAspect, uv.y);
  float n = skyFbm(p * 0.45 + vec2(uTime * 0.0015, 0.0));
  vec3 col = skyAlpine(uv, p, n);
  col = mix(col, skyStorm(uv, p, n), stormAmount(uChapter, uv, n));
  col = mix(col, skyGlobe(uv, p, n), globeMask(uChapter));
  col = mix(col, skyNight(uv, p, n), nightMask(uChapter));
  gl_FragColor = vec4(col, 1.0);
}`;
