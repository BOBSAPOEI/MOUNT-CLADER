/* Water material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
    vUv = uv;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
    vViewPosition = -mvPosition.xyz;

	  gl_Position = projectionMatrix * mvPosition;
}`;

export const fragmentShader = /* glsl */ `precision highp float;

varying vec2 vUv;
varying vec3 vViewPosition;

uniform float uChapter;
uniform float uTime;

uniform vec2 uResolution;

uniform vec3 uWaterColor;
uniform vec3 uLightPosition;
uniform sampler2D tNoiseNormal;
uniform sampler2D tNoise;
uniform sampler2D tMap;

#define PI 3.1415926536
#define PI2 6.28318530718

vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, s, -s, c);
    return m * v;
}

vec2 createRippleNormal(vec2 uv, float repeat, float offset) {
    float x = length(uv - .5) * repeat + offset;
    float ripple = fract(x);

    float angle = ripple * PI2;
    return vec2(cos(angle), sin(angle));
}

void main() {
    float t = uTime * .05;

    vec2 rippleUv = rotate(vUv - .5, PI * .25);
    rippleUv.x *= (-3. + smoothstep(0., -2., rippleUv.y));
    rippleUv.y *= (-1. + smoothstep(0., -.1, rippleUv.y));
    rippleUv /= (1. + texture2D(tNoiseNormal, vUv + t * .01).r * length(rippleUv) * 1.);

    rippleUv += .5;

    float wavesDist = smoothstep(0., 3., length(rippleUv - .5));
    vec2 rippleNormal = createRippleNormal(rippleUv, 20., t * -15.) * .2;
    rippleNormal = max(vec2(0.), rippleNormal);
    rippleNormal *= smoothstep(1., .9, length(rippleUv - .5 - vec2(0., .55)));
    rippleNormal += length((rippleUv - .5)) * texture2D(tNoise, vUv * 2. + t * 2.).r * 2.;
    rippleNormal *= smoothstep(.4, .2, length(rippleUv - .5));

    float noise = texture2D(tNoiseNormal, vUv).r * .1;

    vec2 normalUv = vUv * 3. + vec2(t * .5 + noise * .5, t * .7 + noise * .5);
    vec3 noise1 = texture2D(tNoiseNormal, normalUv).rgb;
    vec3 noise2 = texture2D(tNoiseNormal, normalUv * 2.).rgb;
    vec3 noise3 = texture2D(tNoiseNormal, normalUv * 4. - t * 5.).rgb;
    vec3 normal = (noise1 + noise2 * 0.5 + noise3 * 0.25) * .64;
    normal.rg *= 1. + rippleNormal * .4;
    normal *= smoothstep(3., .2, length(vUv - .5));

    float noisee = smoothstep(.7, .5, texture2D(tNoiseNormal, vUv * 5. + noise2.rg * .2 + t * 1.).r);
    float foam = texture2D(tMap, (vUv * (1. - vec2(sin(t * 50. + cos(t * 20. + 48952.1) * .5) * .01 * abs(vUv.x - .5) * vUv.x, sin(t * 50. + cos(t * 20. + 48952.1) * .5) * .01 * abs(vUv.y - .5) * vUv.y))) + rippleNormal * .01 + vec2(sin(-t * 300. + abs(vUv.y - .5) * 1500.) * .0005, cos(-t * 200. + abs(vUv.x - .5) * 2000.) * .0005)).r;
    foam *= (1. - smoothstep(.1, .5, abs(rippleUv.x - .42)) * noisee);
    foam *= 1.5 + noisee * .1;
    normal.rg *= 1. - foam * 2.;

    vec3 halfwayDir = normalize(uLightPosition + vViewPosition);
    float specular = pow(max(dot(normal, halfwayDir), 0.0), 10.);

    vec3 color = uWaterColor + specular * .03;
    color += (texture2D(tNoise, vUv * .1 + t * .1).r - .5) * .2;

    color += foam * 1.2;
    color = mix(color, vec3(0.00784313725490196, 0.10588235294117647, 0.17254901960784313), smoothstep(1.5, 2., uChapter) * .3);

    float alpha = smoothstep(1., 1.2, uChapter);
    

    gl_FragColor = vec4(color, alpha);
}`;
