/* TransitionClouds material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

varying vec2 vUv;

void main() {
	vUv = uv;
	
	gl_Position = vec4(position.xy, -.1, 1.0);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

varying vec2 vUv;

uniform vec3 uTransitionColor;
uniform sampler2D tNoise, tMouse;
uniform float uTime, uLongpress, uTransition, uRatio, uCameraProgress;

#define PI 3.141592653589793

#include <common>

void main() {
	float longpress = max(uTransition, uLongpress);
	float fortEnergy = smoothstep(3., 4., uCameraProgress);
	vec2 resizedUv = vec2(vUv.x * uRatio, vUv.y);
	float mouse = texture2D(tMouse, vUv + .1 * (texture2D(tNoise, resizedUv * 2.).rg - .5)).g;
	vec2 camUv;
	camUv.x = resizedUv.x + uCameraProgress * PI * 2. / 5.;
	camUv.y = vUv.y;
	camUv += .08 * clamp(mouse, 0., 1.);
	camUv += 0.01 * (rand(gl_FragCoord.xy) - .5);

	vec2 dcamUv = camUv + .2 * texture2D(tNoise, camUv + .01 * uTime).rg;
	float bigClouds = texture2D(tNoise, .4 * dcamUv + vec2(0., -.01 * uTime)).r - .5;
	float clouds = texture2D(tNoise, dcamUv + vec2(0., -.01 * uTime)).r - .5;
	float antiClouds = texture2D(tNoise, .7 * camUv + vec2(.003 * uTime)).r;

	clouds *= antiClouds;

	float cloudZone = vUv.y + 3. * cos(vUv.x - .5) + 0.1 * clouds + 0.7 * bigClouds;
	cloudZone -= .06 * abs(sin(resizedUv.x * 7. + clouds));
	cloudZone = smoothstep(3.6, 3.3, cloudZone + 1. - longpress - .2 * fortEnergy);

	vec3 color = uTransitionColor;

	color += .3 * antiClouds;

	float alpha = cloudZone;

	alpha *= smoothstep(0., 0.05, longpress);

	

	gl_FragColor = vec4(color, alpha);
	

	gl_FragColor = linearToOutputTexel(gl_FragColor);

}`;
