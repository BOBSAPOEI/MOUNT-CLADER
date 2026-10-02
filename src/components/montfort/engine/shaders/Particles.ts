/* Particles material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

attribute vec3 position;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;

uniform float uChapter, uPage, uSize, uDpr, uTime;

#define PI 3.1415
varying float vOpacity;

void main() {

	vec3 pos = position;
	float t = 5. + uTime * .025;
	float seed = (position.x + position.y + position.z) * 20.;
	float seedNormalize = abs(sin(seed));

	float theta2 = (sin(position.y + t) + 1.) * PI + t;

	
	

	pos += vec3(cos(pos.x + t * 5. + theta2) * (pos.y * 3. + sin(seed * 36. + t) * 10.) * .05, sin(pos.z + t * 2. + theta2), sin(pos.x + t * 5. + theta2) * (pos.y * 3. + sin(seed * 36. + t) * 10.) * .2) * .5;

	
	float chapter = smoothstep(4.1, 5., uChapter) * 1. - step(0.5, uPage);
	pos.xz += 40. * (-.2 + .2 * chapter);

	vOpacity = seedNormalize;
	float size = uSize * uDpr * vOpacity;

	gl_PointSize = clamp(size * (30.0 / length(modelMatrix * vec4(pos, 1.))), size * 1.5, size * 5.);
	

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform vec3 uColor;
uniform float uOpacity, uTransition, uPage, uChapter;

varying float vOpacity;

void main() {

	float homepage = 1. - step(0.5, uPage);
	float trading = step(0.5, uPage) * (1. - step(1.5, uPage));
	float transition = smoothstep(0., .5, uTransition);

	vec2 uv = ( vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;

	vec3 color = uColor;

	float alpha =  smoothstep(0.5, 0., length(uv - 0.5)) * vOpacity * uOpacity;
	alpha *= mix(smoothstep(1., .8, uChapter), smoothstep(4.2, 4.3, uChapter), homepage);
	alpha *= 1. - transition;
	

	gl_FragColor = vec4(color, alpha);
}`;
