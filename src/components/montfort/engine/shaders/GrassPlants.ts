/* GrassPlants material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec2 uv;
attribute vec3 position;
attribute mat4 instanceMatrix;

varying float vSeed;
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform float uScrollProgress, uChapter;
uniform vec2 uMouse;

void main() {
	vUv = uv;
	vPosition = position;

	mat4 im = instanceMatrix;
	im[3][2] = fract((im[3][2] + uScrollProgress * 2.5) * .05 + .8) * 20. - 8.;

	float seed = (im * vec4(1.)).x;
	vSeed = seed;

	float scale = smoothstep(1.2, 1.5, uChapter + seed * .01);
	mat4 scaleMatrix = mat4(scale, 0.0, 0.0, 0.0, 0.0, scale, 0.0, 0.0, 0.0, 0.0, scale, 0.0, 0.0, 0.0, 0.0, 1.0);
	im *= scaleMatrix;

	float up = vPosition.y / .7;

	float time = uTime + sin(uTime + vPosition.x * .2 + seed) * .5 + sin(uTime + vPosition.z * .2 + seed) * .2 + sin(uTime + vPosition.x * .2 + up * 1. + seed) * .1;
	vec2 dUv = vUv;
	vPosition.x += cos(sin(vPosition.z * .4 + time + up * 5.)) * .2 * (up * .6 + .02);
	vPosition.z += cos(sin(vPosition.x * .4 + time + up * 5.)) * .2 * (up * .6 + .02);

	vec4 finalPos = projectionMatrix * modelViewMatrix * im * vec4(vPosition, 1.0);
	vec3 ndc = finalPos.xyz / finalPos.w;

	float dist = length(ndc.xy - uMouse);
	vPosition *= 1. + smoothstep(.5, .0, dist) * .1;
	vPosition.xz += smoothstep(.5, .0, dist) * .2 * vPosition.y;

	gl_Position = projectionMatrix * modelViewMatrix * im * vec4(vPosition, 1.0);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

varying vec2 vUv;
varying vec3 vPosition;

varying float vSeed;
uniform sampler2D uMap;
uniform vec3 uLight;
uniform float uWind, uTime;

vec3 hueShift(vec3 color, float hue) {
	vec3 k = vec3(0.57735, 0.57735, 0.57735);
	float cosAngle = cos(hue);
	return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

void main() {
	vec3 map = texture2D(uMap, vUv).rgb * 1.8 * (smoothstep(0., .2, vPosition.y) * .7 + .3) + .15;

	map *= mix(vec3(.8, .8, .9), vec3(.9, .9, .2), smoothstep(0., .1, vSeed));
	map = hueShift(map, -vSeed * .05);

	gl_FragColor = vec4(map, 1.);
}`;
