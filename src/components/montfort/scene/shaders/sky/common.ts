/** Helpers available to every sky chunk. */
export const SKY_COMMON_GLSL = /* glsl */ `
float skyFbm(vec2 p) {
  float s = texture2D(tNoise, p).r * 0.5;
  s += texture2D(tNoise, p * 2.03 + 0.37).r * 0.3;
  s += texture2D(tNoise, p * 4.1 + 0.81).r * 0.2;
  return s;
}
`;
