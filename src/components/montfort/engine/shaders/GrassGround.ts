/* GrassGround material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float uScrollProgress;
uniform float uRatio;

attribute vec2 uv;
attribute vec3 position;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
	vUv = uv;

	vec3 pos = position;
	pos.x *= uRatio;
	vUv.x *= uRatio;
	vPosition = pos;
	vPosition.z += uScrollProgress * .2;
	vUv.y -= uScrollProgress * .2;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

varying vec2 vUv;
varying vec3 vPosition;

uniform sampler2D uMap, uHeight, uNoise;
uniform sampler2D tMouseComputation;
uniform vec2 uResolution;
uniform vec3 uLight;
uniform float uScrollProgress, uChapter;
uniform float uWind, uTime;

vec3 adjustSaturation(vec3 color, float saturation) {
	return mix(vec3(dot(color, vec3(0.2125, 0.7154, 0.0721))), color, saturation);
}

vec3 hueShift(vec3 color, float hue) {
	vec3 k = vec3(0.57735, 0.57735, 0.57735);
	float cosAngle = cos(hue);
	return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

void main() {
	float chapterFade = smoothstep(1., 1.3, uChapter);
	float mouse = min(1., max(0., texture2D(tMouseComputation, gl_FragCoord.xy / uResolution).r)) * chapterFade;

	vec2 uv = vUv;

	float up = vPosition.y / .45;
	float time = uTime * .5 + sin(uTime + vPosition.x * .5) * .5 + sin(uTime + vPosition.z * .5) * .2 + sin(uTime + vPosition.x * .5 + (up * .5 + .5) * 10.) * .1;
	
	vec2 dUv = vUv;
	dUv.x += cos(sin(vPosition.z * .4 + time + mouse * .5) - mouse * .01) * .01 * ((up * .5 + .5) * .4 + .5);
	dUv.y += cos(sin(vPosition.x * .4 + time + mouse * .5) - mouse * .01) * .01 * ((up * .5 + .5) * .4 + .5);

	float lacunarity = (texture2D(uNoise, vUv * .5).r * .5) + .1;

	
	vec3 map = texture2D(uMap, dUv).rgb;
	float height = texture2D(uHeight, dUv, (1. - up) * 3.).r * chapterFade + mouse * .05;

	float alpha = smoothstep(up - .1, up, height);
	alpha *= smoothstep(1., 1.5, uChapter);

	vec3 color = map;
	color *= up * .5 + 1.;
	color *= height * 1.8;
	color -= length(dUv - vUv) * 15. - .12;
	

	float readabilityFactor = smoothstep(1.3, 2., uChapter);
	color = hueShift(color, -.3 + .3 * readabilityFactor);
	color = adjustSaturation(color, 1.3);

	vec2 e = vec2(1. / 2048., 0.);
	vec3 normal = vec3(0, 0., .5);
	normal.x += (texture2D(uHeight, dUv + e.xy).r - texture2D(uHeight, dUv - e.xy).r);
	normal.z += (texture2D(uHeight, dUv + e.yx).r - texture2D(uHeight, dUv - e.yx).r);
	vec3 light = uLight + vec3(-0., .0, 5.);

	float lambertian = dot(normal, light);
	color *= 1. + lambertian * .05 * vec3(1.0, 0.7, 0.0) * 2.;

	color *= 1. - .3 * readabilityFactor;
	color += .05 * readabilityFactor;

	gl_FragColor = vec4(color, alpha);
}`;
