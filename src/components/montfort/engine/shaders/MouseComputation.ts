/* MouseComputation material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `varying vec2 vUv;

void main() {
	vUv = uv;

	gl_Position = vec4(position, 1.0);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform float uTime;
uniform vec2 uMouse, uMouseVelocity;
uniform sampler2D tNoise;

uniform sampler2D tLast;

varying vec2 vUv;

const float propagationFactor = .15;
const float remananceFactor = 0.99;
const float velocityFactor = .005;

void main() {
    vec2 uv = vUv;
    vec2 mouseUv = (uMouse * .5) + .5;
    vec2 velocityOffset = uMouseVelocity * velocityFactor;

    float distFromMouse = length(uv - mouseUv);

    float circle = smoothstep(.05, 0., distFromMouse);
    float smoothcircle = smoothstep(.1, 0., distFromMouse);
    float smoothercircle = smoothstep(.15, 0., distFromMouse);

    float noise = texture2D(tNoise, uv * .5 + uTime * .01).r * 2. - 1.;

    vec4 remanance = vec4(0.);

    remanance += texture2D(tLast, vUv + vec2(noise * propagationFactor, 0.) - velocityOffset) * .25;
    remanance += texture2D(tLast, vUv + vec2(-noise * propagationFactor, 0.) - velocityOffset) * .25;
    remanance += texture2D(tLast, vUv + vec2(0., noise * propagationFactor) - velocityOffset) * .25;
    remanance += texture2D(tLast, vUv + vec2(0., -noise * propagationFactor) - velocityOffset) * .25;
    remanance.b *= .99;

    vec4 color = vec4(0.);
    color.r = 1. * circle;
    color.g = .4 * smoothcircle;
    color.b = .07 * smoothercircle;

    color += remanance * remananceFactor;

    color.a = 1.;

    gl_FragColor = color;
}`;
