/** Backdrop behind the globe. */
export const SKY_GLOBE_GLSL = /* glsl */ `
float globeMask(float chapter) {
  return smoothstep(2.9, 3.1, chapter);
}
vec3 skyGlobe(vec2 uv, vec2 p, float n) {
  return uGlobeBg;
}
`;
