/* HoverParticles material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

attribute float aType;
attribute vec3 aPosition;

varying vec2 vUv;
varying float vIsLine;
varying float vLife;

uniform float uTime;
uniform vec3 uHoverPosition;

#include <common>

void main() {
	vIsLine = step(0., aType) * (1. - step(1., aType));
	vLife = smoothstep(20., 0., length(uHoverPosition - aPosition));

	vec3 offset = aPosition;

	float seed = rand(aPosition.xy);

	vec4 mvPosition = modelViewMatrix * vec4(offset, 1.0);

	vec3 pos = position;

	const float translateY = 6.;
	pos.y += -3. + vLife * translateY;

	vec3 direction = (uHoverPosition - aPosition);
	const float tiltFactor = -0.015;
	pos.x += (direction.x * tiltFactor + seed * .2) * pos.y;
	pos.z += (direction.z * tiltFactor + seed * .2) * pos.y;

	float t = uTime * (.5 + vIsLine * .5);
	pos.y += sin(offset.x * .1 + t * 2. + seed * 5.) * .5 + .5 * (.2 + (1. - vIsLine) * 5.);
	pos.x += sin(t + seed * 10.) * (1. - vIsLine);

	mvPosition.xyz += pos;
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform float uDotSize;
uniform float uGridSize;
uniform float uLongpress;
uniform float uChapter;
uniform float uHover;
uniform vec3 uColor;

varying float vLife;
varying float vIsLine;
varying vec2 vUv;

void main() {
	
	float linePattern = smoothstep(.1, .02, abs(vUv.x - .5));
	linePattern *= smoothstep(.5, .45, abs(vUv.y - .5));

	
	float dotPattern = smoothstep(.15, 0., length((vUv - .5) * vec2(1., 2.))) * .5;

	vec3 linesColor = vec3(0.376, 0.678, 0.816);
	vec3 dotsColor = vec3(1.);

	float alpha = mix(dotPattern, linePattern, vIsLine) * vLife * uHover;
	if(alpha <= .001)
		discard;

	vec3 color = mix(dotsColor, linesColor, vIsLine);

	gl_FragColor = vec4(color, alpha * (1. - uLongpress) * (1. - uChapter));
}`;
