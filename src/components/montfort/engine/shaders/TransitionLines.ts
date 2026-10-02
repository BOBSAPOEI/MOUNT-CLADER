/* TransitionLines material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

#define PI 3.141592653589793

uniform float uRatio;

attribute vec3 offset;

varying vec2 vUv;
varying float vSeed;
varying vec3 vViewPosition;

highp float rand(const in vec2 uv) {
    const highp float a = 12.9898, b = 78.233, c = 43758.5453;
    highp float dt = dot(uv.xy, vec2(a, b)), sn = mod(dt, PI);
    return fract(sin(sn) * c);
}

void main() {
    vUv = uv;

	vSeed = rand(position.xy);
	vec4 mvPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.);
	vec3 transformed = vec3(offset.x / uRatio, offset.y, 0.);
	transformed *= 4.;

	gl_Position = mvPosition + vec4(transformed, 0.);
	vViewPosition = gl_Position.xyz;
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform float uTime, uTransition;

varying vec2 vUv;
varying float vSeed;
varying vec3 vViewPosition;

void main() {
	if(uTransition < 0.01) discard;
	
	 vec3 color = vec3(1.);
	float intensity = abs(vUv.x - .5);
	float alpha = 0.8 * smoothstep(0.02, 0., intensity);
	alpha *= smoothstep(0.1, .3, vUv.y) * smoothstep(1., .9, vUv.y);
	
	alpha += (0.1 * smoothstep(0.08, 0., intensity) + .2 * smoothstep(0.5, 0., intensity)) * smoothstep(0., .1, vUv.y) * smoothstep(1., .92, vUv.y);

	alpha *= smoothstep(.1, .15 + vSeed * .2, uTransition - vUv.y + .12 * sin(.1 * vViewPosition.x));

	gl_FragColor = vec4(color, alpha);
	

}`;
