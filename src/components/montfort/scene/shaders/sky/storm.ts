/**
 * Storm chapter (divisions). `stormAmount` is also used by the cloud decks so sky and clouds
 * darken together: a noisy diagonal wipe that sweeps up the screen, then clears.
 */
export const STORM_MASK_GLSL = /* glsl */ `
float stormAmount(float chapter, vec2 uv, float n) {
  float front = chapter - 0.35 * uv.y + 0.12 * (n - 0.5);
  float inward = smoothstep(2.16, 2.42, front);
  float outward = 1.0 - smoothstep(2.82, 3.0, chapter);
  return inward * outward;
}
`;

export const SKY_STORM_GLSL = /* glsl */ `
vec3 skyStorm(vec2 uv, vec2 p, float n) {
  return mix(uDark * 0.9, uDark * 1.25, skyFbm(p * vec2(0.6, 2.4) + 3.0) * 0.8);
}
`;
