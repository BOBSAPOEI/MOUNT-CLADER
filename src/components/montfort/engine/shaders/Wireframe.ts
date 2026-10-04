/* Wireframe material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `#define PI 3.1415926536
#define PI2 6.2831853072

attribute float aInstanceId;

varying vec2 vUv;
varying float vFade;

uniform float uTime;
uniform float uScrollProgress;

mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0, oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0, oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0, 0.0, 0.0, 0.0, 1.0);
}

void main() {
  vUv = uv;

  float t = uTime * .1;

  vec3 transformed = position;

    #ifdef IS_METAL
  const float offset = .06;
    #else
  const float offset = .06;
    #endif

  const float radius = 7.;
  const float maxAngle = PI * .7 + offset;
  const float minAngle = -PI * .15;

  float angle = PI2 * aInstanceId * offset - t - uScrollProgress * .5;
  angle = mod(angle, maxAngle) + minAngle;

  float fadeIn = smoothstep(maxAngle + minAngle, maxAngle + minAngle - 1., angle);
  float fadeOut = smoothstep(minAngle, minAngle + 1., angle);

  vFade = fadeIn * fadeOut;

    #ifdef IS_METAL
  float depthFade = smoothstep(-2., -1., position.y);
  vFade *= depthFade;
    #endif

  float odd = mix(-1.0, 1.0, step(0.5, mod(aInstanceId, 2.0)));

    #ifdef IS_METAL
  transformed = (rotation3d(vec3(0., 1., 0.), t * 2. + odd * .5) * vec4(transformed, 0.)).xyz;
  transformed = (rotation3d(vec3(1., 0., 0.), angle * .2 * odd * -1. + PI * .25) * vec4(transformed, 0.)).xyz;
    #else
  transformed = (rotation3d(vec3(0., 1., 0.), t * -2. + odd) * vec4(transformed, 0.)).xyz;
  transformed = (rotation3d(vec3(1., 0., 0.), angle * .8) * vec4(transformed, 0.)).xyz;
    #endif

  transformed += vec3(sin(angle) * radius, 0., cos(angle) * radius);

  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
  gl_Position = projectionMatrix * mvPosition;
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tMap;
uniform sampler2D tNoise;
uniform sampler2D tMouseComputation;
uniform vec2 uResolution;
uniform float uTime;
uniform float uFadeProgress;
uniform vec3 uAccentColor, uBackgroundColor;

varying vec2 vUv;
varying float vFade;

void main() {
    float mouse = max(0., texture2D(tMouseComputation, gl_FragCoord.xy / uResolution).g);
    float wireframe = texture2D(tMap, vUv).r;
    float glow = texture2D(tMap, vUv, 3.).r;

    float noise = max(0., smoothstep(.9, 0., texture2D(tNoise, vUv * .2 + uTime * .01).r) * 10. - 5.);

    vec3 color = mix(uAccentColor, uBackgroundColor, wireframe * glow) * (1. + (noise + mouse * .25) * .7);

    gl_FragColor = vec4(color, vFade * uFadeProgress);
    
}`;
