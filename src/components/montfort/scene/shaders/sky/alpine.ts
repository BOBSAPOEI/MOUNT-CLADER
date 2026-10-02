/**
 * Overcast sky of the hero / who-we-are / what-we-do chapters: pale haze at the horizon, a greyer
 * overcast towards the top corners and slow, soft cloud wisps.
 */
export const SKY_ALPINE_GLSL = /* glsl */ `
vec3 skyAlpine(vec2 uv, vec2 p, float n) {
  vec3 horizon = vec3(0.885, 0.915, 0.935);
  vec3 zenith = vec3(0.75, 0.785, 0.81);
  vec3 corner = vec3(0.6, 0.645, 0.675);
  vec3 col = mix(horizon, zenith, smoothstep(0.4, 1.0, uv.y));
  vec2 c = vec2((uv.x - 0.5) * uAspect, uv.y - 0.3);
  col = mix(col, corner, smoothstep(0.75, 1.35, length(c)) * smoothstep(0.45, 1.0, uv.y));

  float w1 = skyFbm(p * 0.28 + vec2(uTime * 0.0012, 0.0));
  float w2 = skyFbm(p * 0.5 + vec2(-uTime * 0.0008, 0.4));
  float upper = smoothstep(0.35, 0.95, uv.y);
  col *= 1.0 - smoothstep(0.4, 0.8, w1) * 0.07 * upper;
  col = mix(col, horizon * 1.02, smoothstep(0.5, 0.85, w2) * 0.3 * upper);
  return col;
}
`;
