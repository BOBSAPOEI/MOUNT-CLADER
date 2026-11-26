/* GovernanceBackground material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

uniform float uTime, uChapter;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
	vUv = uv;
	vec4 tmpPosition = modelMatrix * vec4(position, 1.0);
	float middleTree = step( 491., length(tmpPosition.xz)) * (1. - step( 525., length(tmpPosition.xz)));
	float frontTree = step( 525., length(tmpPosition.xz));

	float chapter = smoothstep(4.1, 5., uChapter);
	vec3 transformed = position;

	
	transformed *= 1. + (0.4 * (1. - chapter) * frontTree);

	/* Left translation - baackground & front tree */
	transformed.z += ( -.15 + .3 * chapter) * (1. - middleTree);

	/* Right translation - middle tree */
	transformed *= 1. + (1.5 + 0.8 * (1. - chapter)) * middleTree;
	
	transformed.z += (-0.5 + 0.6 * chapter) * middleTree;

	vec4 mvPosition = modelMatrix * vec4(transformed, 1.0);
	vWorldPosition = mvPosition.xyz;
	gl_Position = projectionMatrix * viewMatrix * mvPosition;
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tMap, tNoise;
uniform float uTime, uChapter;
uniform vec3 uProjectedPos;

varying vec2 vUv;
varying vec3 vWorldPosition;

vec2 rotateUV(vec2 uv, vec2 mid, float rotation) {
	return vec2(cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x, cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y);
}

void main() {
	float frontTrees = step( 460., vWorldPosition.x);
	vec2 noiseUv = vUv + .05 * (texture2D(tNoise, .1 * vUv + vec2(.001, .001) * uTime).r - .5);
	vec4 map = texture2D(tMap, noiseUv);

	float chapter = smoothstep(4.1, 4.2, uChapter);
	map.a *= chapter;

	vec2 dUv = rotateUV(vUv, vec2(1., 0.), 0.3 + .2 * sin(4. * length(uProjectedPos - .5)));

	dUv.x += .02 * smoothstep(4.1, 5., uChapter);
	float godrays = texture2D(tNoise, vec2(4., 0.01) * dUv + vec2(-.01 * uTime, 0.)).r;
	godrays *= texture2D(tNoise, vec2(1., 0.01) * dUv + vec2(.01 * uTime, 0.)).r;
	godrays *= texture2D(tNoise, vec2(4., 0.01) * dUv + vec2(.0 * uTime, 0.01 * uTime)).r;
	godrays += godrays * godrays;

	float mainRay = abs(dUv.x - .85);
	mainRay = smoothstep(.2, 0., mainRay);
	godrays += 1. * mainRay;

	godrays *= smoothstep(0., .4, dUv.y) * smoothstep(1., .4, dUv.y);
	godrays *= vUv.x;
	godrays *= 1. - frontTrees;

	map.rgb += vec3(1., .9, .4) * 1.2 * godrays;

	if(map.a < .05)
		discard;
	
	map.rgb = mix(map.rgb, 0.6 * vec3(0.024, 0.082, 0.118), .75);
	
	
	gl_FragColor = map;

	gl_FragColor = linearToOutputTexel(gl_FragColor);
	gl_FragColor.rgb = mix(vec3(0.0196, 0.0745, 0.1098), gl_FragColor.rgb, chapter);
}`;
