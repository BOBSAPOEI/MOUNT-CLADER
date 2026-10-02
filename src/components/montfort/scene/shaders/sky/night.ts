/** Night backdrop of the sustainability chapters (behind the forest). */
export const SKY_NIGHT_GLSL = /* glsl */ `
float nightMask(float chapter) {
  return smoothstep(3.98, 4.14, chapter);
}
vec3 skyNight(vec2 uv, vec2 p, float n) {
  return uNight;
}
`;
