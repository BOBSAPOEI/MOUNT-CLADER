/* PowerLine material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

varying vec2 vUv;
varying float vSeed;

void main() {
	vUv = uv;
	vec3 transformed = position;

	vec4 mvPosition =  vec4(transformed, 1.0);

	mvPosition = instanceMatrix * mvPosition;

	vSeed = instanceMatrix[1][0] + instanceMatrix[0][0];
	gl_Position = projectionMatrix * modelViewMatrix * mvPosition;

	}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tNoise;
uniform vec3 uDarkColor, uLightColor;
uniform vec2 uResolution;
uniform float uTime, uTransition, uTransitionDirection;
uniform float uChapter;

varying vec2 vUv;
varying float vSeed;

void main() {
	vec2 sUv = gl_FragCoord.xy / uResolution;
	float center = abs(vUv.x - .5);

	float tail = smoothstep(0.5, .0, vUv.y);
	float intensity = smoothstep(.05 - .025 * tail, 0., center);
	intensity += .3 * smoothstep(.5 - .4 * tail, 0., center);

	float speed = 1. + 2. * (texture2D(tNoise, vec2(vSeed, 0.)).r - .5);
	float head = fract(2. * vUv.y - uTime * .2 * speed);

	intensity *= smoothstep(1., .98, head);
	intensity *= smoothstep(0., .5, head);

	intensity *= smoothstep(1., .7, vUv.y);

	intensity *= 1. - tail;

	float brightness = .2 + .4 * smoothstep(.7, .98, head);

	intensity *= 1. + 1. * smoothstep(.25, .4, vUv.y) * smoothstep(.6, .5, vUv.y);
	vec3 color = uLightColor * clamp(brightness + intensity, 0., 1.5);

	float textShadow = smoothstep(0.2, 0., abs(sUv.y - .5));
	color *= 1. - .5 * textShadow; 

	float alpha = intensity;
	alpha *= smoothstep(.3, 0., uTransition + .1 * vUv.y);
	alpha *= smoothstep(1., 0., uChapter);

	
	
	
	

	gl_FragColor = vec4(color, alpha);
}`;
