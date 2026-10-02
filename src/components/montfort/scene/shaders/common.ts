/**
 * GLSL shared by the sky, the cloud layers and the scenery so they agree on the
 * chapter-driven look (light haze -> storm -> globe backdrop -> night).
 */
export const COMMON_GLSL = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Storm front: a noisy diagonal wipe that sweeps up the screen between chapters 2.2 and 2.45,
// then clears again between 2.82 and 3.0.
float stormAmount(float chapter, vec2 uv, float n) {
  float front = chapter - 0.35 * uv.y + 0.12 * (n - 0.5);
  float inward = smoothstep(2.16, 2.42, front);
  float outward = 1.0 - smoothstep(2.82, 3.0, chapter);
  return inward * outward;
}
`;
