/* Sky material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

uniform float uPage, uScrollProgress;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
	float whoWeAre = 1. - step(-0.5, uPage);

	vec2 wWAUv = fract(.5 * uv + vec2(0., .01 * uScrollProgress));

	vUv = mix(uv, wWAUv, whoWeAre);
	vPosition = position;
	 vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  gl_Position.z = gl_Position.w;
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tNoise, tNearestNoise, tMouse;
uniform vec3 uTransitionColor, uLightColor, uDarkColor;
uniform vec2 uResolution;
uniform float uTime, uPage, uTransition, uTransitionDirection, uChapter, uScrollProgress;

varying vec2 vUv;

vec2 rotateUV(vec2 uv, vec2 mid, float rotation) {
	return vec2(cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x, cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y);
}

#include <common>

void main() {
	vec2 dUv = vUv;
	vec2 sUv = gl_FragCoord.xy / uResolution;
	dUv.x += 0.01 * uTime;

	float whoWeAre = 1. - step(-0.5, uPage);
	float homepage = step(-0.5, uPage) * (1. - step(0.5, uPage));
	float trading = step(0.5, uPage) * (1. - step(1.5, uPage));
	float capital = step(1.5, uPage) * (1. - step(2.5, uPage));
	float maritime = step(2.5, uPage) * (1. - step(3.5, uPage));
	float fortEnergy = step(3.5, uPage) * (1. - step(4.5, uPage));

	vec2 aUv = vUv + vec2(-0.004 * uTime, 0.002 * uTime);
	float noise = texture2D(tNoise, dUv).r * texture2D(tNoise, aUv).r;

	vec2 dsUv = sUv + 0.5 * (noise - .25);

	float value = length(dsUv - .5) * sUv.y;

	float simpleClouds = texture2D(tNoise, vUv * 2. + vec2(-0.001 * uTime, 0.)).g;

	value = 1. - value;
	value += 0.5 * simpleClouds;

	vec2 ditheredUv = vUv + 0.002 * (rand(gl_FragCoord.xy) - .5);
	float ditheredValue = smoothstep(.2 - trading * .08, 0., length(ditheredUv - vec2(.34, .2)));
	value = mix(value, ditheredValue, trading);

	float energyValue = smoothstep(.15, .25, ditheredUv.y + 0.002 * (rand(gl_FragCoord.xy) - .5) + .03 - .1 * abs(sUv.x - .5));
	energyValue *= smoothstep(.26, .25, vUv.y);
	
	
	vec2 feUv = vUv;
	feUv.y *= 2. + .8 * pow2(abs(sUv.x - .5));
	feUv.x *= 1. + .2 * (sUv.x - .5);
	feUv *= 1. + .08 * (texture2D(tNoise, 2. * vUv + vec2(0., .007 * uTime)).r - .5);
	float feClouds = texture2D(tNoise, feUv + .2).r;
	feClouds = smoothstep(0.55, 0., feClouds);
	energyValue += feClouds;
	energyValue = min(energyValue, 1.);

	value = mix(value, energyValue, fortEnergy);

	vec3 color = mix(uDarkColor, uLightColor + .08 * homepage, clamp(value, 0., 1.));

	/* Trading lines behind mountain */
	float lines = texture2D(tNoise, vUv * vec2(8., .1) + vec2(.0, .01 * uTime)).r * .85;
	lines = smoothstep(.5 - .15 * value, .8, lines);
	lines *= smoothstep(0.5, 1., value);
	

	vec2 uv = vUv * vec2(6., -8.);
	float basic2Noise = texture2D(tNoise, uv * 2.5 * vec2(2., 1.)).r;
	float mouse = clamp(texture2D(tMouse, sUv + 0.1 * vec2(basic2Noise)).r, 0., 1.);
	
	/* Fort energy stars */

	if (fortEnergy == 1.){
		vec2 starsUv = fract(vUv * 150.); /* First layers of stars */
		vec2 starsUniqUv = floor(vUv * 150.) / 150.;
		vec3 uniqNoise = texture2D(tNearestNoise, starsUniqUv).rgb;
		float starMaker = length(starsUv - .5 + 0.4 * vec2(uniqNoise.rg - .5));
		float stars = smoothstep(.05, 0., starMaker);
		stars += .1 * smoothstep(.15, 0., starMaker); /* Glow */
		stars *= smoothstep(.7, 1., uniqNoise.b);

		starsUv = fract(vUv * 200.); /* Second layers of stars */
		starsUniqUv = floor(vUv * 200.) / 200.;
		uniqNoise = texture2D(tNearestNoise, starsUniqUv + .5).rgb;
		starMaker = length(starsUv - .5 + 0.4 * vec2(uniqNoise.rg - .5));
		float stars2 = smoothstep(.05, 0., starMaker);
		stars2 += .1 * smoothstep(.1, 0., starMaker); /* Glow */
		stars2 *= smoothstep(.7, 1., uniqNoise.b);
		
		starsUv = fract(vUv * 230.); /* Third layers of stars */
		starsUniqUv = floor(vUv * 230.) / 230.;
		uniqNoise = texture2D(tNearestNoise, starsUniqUv + .1).rgb;
		starMaker = length(starsUv - .5 + 0.4 * vec2(uniqNoise.rg - .5));
		float stars3 = smoothstep(.05, 0., starMaker);
		stars3 += .1 * smoothstep(.1, 0., starMaker); /* Glow */
		stars3 *= smoothstep(.7, 1., uniqNoise.b);

		stars += stars2;
		stars += .8 * stars3;

		stars *= smoothstep(.25, .15, vUv.y);
		stars *= smoothstep(.2, 0., feClouds);
		stars *= .8 + mouse;
		color += stars * (.4 + uLightColor) * fortEnergy;

		color = mix(color, vec3(0.), smoothstep(.5, 1., uChapter));

	}

	

	color += lines * uLightColor * vec3(.3, .7, .5) * trading;

	
	
	float transition = smoothstep(0., 0.2, uTransition);
	color = mix(color, uTransitionColor, transition);

	/* Clouds background for transition */

	float count = 4.;

	vec2 fUv = uv + vec2(0.005 * uTime, 0.) + .01 * mouse;
	vec2 cUv = vec2(uv.x, uv.y * (count)) + .01 * mouse;
	cUv.y -= 2.;
	float offset = 1.5 * (smoothstep(0.7 + .2 * texture2D(tNoise, uv * 4.).r, 1., fract(cUv.y)) + floor(cUv.y));

	float cloudShape = (-.01 * abs(sin(uv.x * 50. + offset)) - 0.03 * abs(sin(uv.x * 15. + offset)) - 0.02 * abs(sin(fUv.x * 17. + offset))) * count;
	cUv.y += cloudShape;

	cUv *= 1. + .3 * (texture2D(tNoise, fUv * .3).rg - .5);
	cUv.y += 1. * (texture2D(tNoise, fUv * .4).r - .5);
	cUv.y -= .05 * count * texture2D(tNoise, fUv * 4.).r;

	float cloudRows = fract(cUv.y);
	cloudRows += smoothstep(0.5, 0., cloudRows);

	vec2 sCUv = uv + vec2(.01 * uTime) + .2 * texture2D(tNoise, uv * 1.).r + .05 * vec2(basic2Noise) + .01 * mouse;
	float smallCloudsNoise = texture2D(tNoise, sCUv * 0.1).r;
	float offsetSmallCloudsNoise = texture2D(tNoise, sCUv * 0.1 + vec2(0., -.01)).r;
	vec2 smallClouds = vec2(smoothstep(.5, .62, offsetSmallCloudsNoise), smoothstep(.46, .5, smallCloudsNoise));

	float clouds = mix(cloudRows, smallClouds.r, smallClouds.g);
	clouds = clamp(clouds, 0., 1.);

	vec3 darkColor = vec3(0.737, 0.773, 0.8) * (1. + .13 * whoWeAre);
	vec3 cloudySkyColor = mix(darkColor, vec3(0.961, 0.969, 0.976), clouds);

	color = mix(color, cloudySkyColor, .5 * clamp(.3 * homepage + transition, 0., 1.));
	color = mix(color, cloudySkyColor, whoWeAre);

	/* Homepage chapters background */
	if(homepage == 1.) {
		vec3 seaColor = vec3(0.31, 0.373, 0.427);
		vec3 globeSky = vec3(0.0196, 0.0745, 0.1098);

		color = mix(color, seaColor, smoothstep(2.5, 2.7, uChapter + dUv.y + 0.1 * noise));
		color = mix(color, globeSky, smoothstep(4., 4.1, uChapter));
		color = mix(color, vec3(.11, 0.22, 0.26), smoothstep(4.2, 4.3, uChapter));
	} else if(trading == 1.) {
		color *= 1. - (min(1., uChapter));
	}
	
	
	gl_FragColor = vec4(color, 1.);

	
}`;
