/* EnergyBg material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tNoise;
uniform vec3 uDarkColor, uLightColor;
uniform float uTime, uTransition, uTransitionDirection;

varying vec2 vUv;

void main() {
	vec3 color = uDarkColor;

	float height = vUv.y;
	height -= .6 * abs(vUv.x - .5);
	height += .6 * (texture2D(tNoise, vec2(vUv.x, .5)).r - .5);
	height += .1 * (texture2D(tNoise, vec2(6. * vUv.x, .5)).r - .5);
	float hills = smoothstep(.28, .3, height);

	color += 2. * uLightColor * height * (vUv.y + .1 * sin(uTime));
	
	color *= 1. - .5 * smoothstep(.35, .5, vUv.x) * smoothstep(.65, .5, vUv.x);

	float alpha = hills;

	alpha *= smoothstep(.1, 0., uTransition);

	gl_FragColor = vec4(color, alpha);
}`;
