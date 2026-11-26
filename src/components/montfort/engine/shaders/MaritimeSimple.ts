/* MaritimeSimple material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
	vUv = uv;
	vPosition = position;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tMap;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
	vec4 map = texture2D(tMap, vec2(vUv.x, 1. - vUv.y));
	map.rgb *= .05 + .6 * smoothstep(.2, .9, map.rgb); 
	map.rgb *= smoothstep(30., 15., vPosition.y);
	gl_FragColor = map;
}`;
