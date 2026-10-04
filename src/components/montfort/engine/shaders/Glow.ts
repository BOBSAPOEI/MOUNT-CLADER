/* Glow material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
	vUv = uv;
	vec4 mvPosition =  vec4(position, 1.0);
	mvPosition = modelMatrix * mvPosition;
	vWorldPosition = mvPosition.xyz;
	gl_Position = projectionMatrix * viewMatrix * mvPosition;

	}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tNoise;
uniform vec3 uDarkColor, uLightColor;
uniform float uTime, uTransition;

varying vec3 vWorldPosition;
varying vec2 vUv;

#include <common>

void main() {

	float center = smoothstep(180., 0., length(vWorldPosition.xy + 10. * rand(gl_FragCoord.xy)));

	vec3 color = uLightColor * center * 30.;

	float alpha = .5 * center;

	alpha *= smoothstep(.15, 0., uTransition);
	
	gl_FragColor = vec4(color, alpha);
}`;
