/** Overcast sky of the hero / who-we-are / what-we-do chapters. */
export const SKY_ALPINE_GLSL = /* glsl */ `
vec3 skyAlpine(vec2 uv, vec2 p, float n) {
  float top = smoothstep(0.3, 1.0, uv.y) * (0.5 + 0.9 * n);
  vec3 col = mix(uLight, uLight * vec3(0.78, 0.81, 0.86), top);
  float mottle = smoothstep(0.32, 0.72, skyFbm(p * 0.7 + vec2(0.4, uTime * 0.001))) * smoothstep(0.3, 1.0, uv.y);
  return mix(col, vec3(0.64, 0.69, 0.75), mottle * 0.7);
}
`;
