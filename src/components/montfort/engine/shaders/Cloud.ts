/* Cloud material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

uniform float uChapter;

varying vec2 vUv;
varying float vSeed, vRatio;
varying vec3 vNormal;

#define PI 3.141592653589793

mat4 rotationY( in float angle ) {
	return mat4(	cos(angle),		0,		sin(angle),	0,
			 				0,		1.0,			 0,	0,
					-sin(angle),	0,		cos(angle),	0,
							0, 		0,				0,	1);
}

void main() {
    vUv = uv;

	vec3 transformed = position;
	transformed.y += uChapter * .01;
	
	
	vec4 mvPosition =  vec4(transformed, 1.0);

	vNormal = normalize(normalMatrix * normal);

	mvPosition = instanceMatrix * mvPosition;
	
	vSeed = (instanceMatrix[3][0] + instanceMatrix[3][1]+ instanceMatrix[3][2]);
	vRatio = instanceMatrix[1][1] / instanceMatrix[0][0];
	gl_Position = projectionMatrix * modelViewMatrix * mvPosition;

}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform float uTime, uRatio, uChapter, uTransition;
uniform vec3 uDarkColor, uLightColor;
uniform vec2 uSize, uResolution;
uniform sampler2D tPerlin, tNoise, tMouse;
varying float vSeed, vRatio;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
	vec2 ratioedUv = vec2(5., vRatio) * (vUv + vSeed * .1);
	vec2 resizedUv = uSize * ratioedUv;

	vec2 sUv = gl_FragCoord.xy / uResolution;
	float mouse = clamp(texture2D(tMouse, sUv + .1 * (texture2D(tNoise, 0.4 * resizedUv).g - .5)).r, 0., 1.);
	
	float time = uTime * .5 / uSize.x;
	float strength = 1.;
	vec2 dUv = vUv;
	dUv *= 1. + .03 * mouse;
	dUv += .05 * mouse;
	dUv.y += .3 * strength * (texture2D(tNoise, resizedUv * .2 + vec2(-0.004, -0.02) * time).r - .5);
	dUv.y -= .5 * strength * (texture2D(tNoise, resizedUv * .08 + vec2(0.005, 0.01) * time).r - .5);
	dUv.y *= 1. + 0.1 * strength * (texture2D(tPerlin, resizedUv * .5 - 0.01 * time).r - .5);

	float smoothness = smoothstep(.4, .7, texture2D(tNoise, resizedUv * .08 + vec2(-0.08, -0.04) * time).r);
	
	float clouds = smoothstep(.9 - .1 * smoothness, .7, dUv.y);
	clouds *= smoothstep(0., .2, dUv.y - .2 * smoothstep(.4, 1., dUv.x));

	float alpha = clouds * smoothstep(1., .9, vUv.y) * smoothstep(0., .1, vUv.y) * smoothstep(0., .1, vUv.x)  * smoothstep(1., 0.9, vUv.x) ;

	alpha += smoothstep(0.2, .3, vUv.y) * smoothstep(0.7, .6, vUv.y) * smoothstep(0.2, .3, vUv.x) * smoothstep(.9, 0.8, vUv.x);
	alpha = min(1., alpha);

	float cloudDarkness = smoothstep(.4, 1., dUv.y) + smoothstep(.4, 0., dUv.y);
	vec3 color = mix(vec3(0.82,0.86,0.88), 1.1 * vec3(0.961,0.969,0.976), cloudDarkness); 

	float whiteText = smoothstep(2.2, 2.3, uChapter);
	color *= mix(vec3(1.), vec3(.8, .85, .87), whiteText);
	
	

	vec2 guillotineUv = vec2(uRatio, 1.) * 0.4 * sUv;
	float guillotine = smoothstep(2.3, 2.2, uChapter - .3 * sUv.y + .1 * (texture2D(tNoise, guillotineUv + .02 * texture2D(tNoise, 4. * guillotineUv).r).r - .5));
	
	alpha *= guillotine;
	alpha *= smoothstep(1., 0.3, uTransition);
	alpha *= min(1., smoothstep(.88, .96, vNormal.b) + smoothstep(0.05, 0.0, uTransition)); 
	

	gl_FragColor = vec4(color, alpha);
	
}`;
