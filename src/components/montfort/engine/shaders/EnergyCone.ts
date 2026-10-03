/* EnergyCone material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

varying vec3 vPosition, vWorldPosition, vViewPosition;
varying vec2 vUv;

void main() {
	vUv = uv;

	vPosition = position;
	vec4 mvPosition = modelMatrix * vec4(position, 1.0);
	vWorldPosition = mvPosition.xyz;
	mvPosition =  viewMatrix * mvPosition;
	vViewPosition  = mvPosition.xyz;

	gl_Position = projectionMatrix * mvPosition;
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tNoise, tMouseComputation;
uniform vec3 uColor;
uniform vec2 uResolution;
uniform float uTime, uDPR, uTransition, uTransitionDirection;
uniform float uChapter;
uniform float uLineCount, uHeadLength, uSpeed, uOpacity;
uniform int iSteps;
varying vec2 vUv;
varying vec3 vPosition, vWorldPosition, vViewPosition;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float pow2(float x) {
	return x * x;
}

void main() {
	vec2 sUv = gl_FragCoord.xy / uResolution;
	float mouse = clamp(texture2D(tMouseComputation, sUv).r, 0., 1.);
	float isReflexion = smoothstep(-31.9, -32., vWorldPosition.y);
	float lines = 0.;
	float brightness = 0.;

	vec2 offset;
	vec3 color;
	float top = smoothstep(0.5, 0., vUv.y);
	float farAway = smoothstep(100., 300., length(vViewPosition));
	float aliased = farAway * smoothstep(40., 0., vPosition.y);
	float tipLength = uHeadLength * (.1 + 5. * vUv.y * pow2(vUv.y));
	
	float littleDpr = 1. - step(1.5, uDPR);

	for(int i = 0; i < iSteps; i++) {
		offset.x = (float(i) / (float(iSteps)));
		offset.y = float(i) / float(iSteps);
		vec2 linesUv = vec2(fract(vUv.x * uLineCount + offset.x), vUv.y);
		float uniqLineUv = floor(vUv.x * uLineCount + .5 + offset.x) / uLineCount;
		float line = smoothstep(0.485 - .1 * littleDpr - .1 * farAway - .12 * aliased, 0.5, abs(linesUv.x - .5)) * (1. - .7 * isReflexion);
		line *= 1. - (.5 + 0.5 * littleDpr) * aliased;
		float glow = smoothstep(0., 0.5, abs(linesUv.x - .5));
		glow *= 1. + .5 * aliased;

		float speed = uSpeed * (1. + .8 * (texture2D(tNoise, vec2(uniqLineUv, offset.y + 0.1)).r - .5)); 
		float head = 5. * (texture2D(tNoise, vec2(uniqLineUv, 0.)).r - .5);
		head = fract(head + 1. - vUv.y - uTime * speed + offset.y);

		float uniqLineIntensity = smoothstep(.4, .6, texture2D(tNoise, vec2(uniqLineUv, offset.y)).r) - .5;
		float lineBrightness = smoothstep(0.4, 1., head); /* Fade tail */
		lineBrightness *= smoothstep(1., 1. - (tipLength * .2) - 0.9 * tipLength * (1. - abs(linesUv.x - .5)), head); /* smooth head */

		lines += (0.1 + .1 * isReflexion) * glow * lineBrightness * (1. + uniqLineIntensity);

		lineBrightness += (2. + 8. * uniqLineIntensity + 4. * (1. - vUv.y)) * smoothstep(1. - tipLength, 1., head); /* Head brightness */
		lineBrightness *= smoothstep(1., 1. - (tipLength * .2) - 0.9 * tipLength * (1. - abs(linesUv.x - .5)), head); /* smooth head */
		lines += line * lineBrightness * (1. - isReflexion) * (1. + uniqLineIntensity);

	}

	lines *= smoothstep(0., .1 + .1 * littleDpr, vUv.y); /* Fade top */
	lines *= smoothstep(.65, .3, vUv.y); /* Fade bottom */

	float factor = 0.;
	factor += lines;

	/* ground glow */
	factor *= .7 + 5. * smoothstep(0., 40., vPosition.z) * smoothstep(180., 40., vPosition.z) * smoothstep(90., 120., length(vPosition.xz));

	factor *= .4 + .6 * smoothstep(350., 0., length(vViewPosition));
	factor *= uOpacity;

	factor *= 1. + mouse;

	color = uColor * clamp(factor, 0., 2.5);

	float textShadow = smoothstep(0.2, 0., abs(sUv.y - .5));
	color *= 1. - .7 * textShadow; /* Title more visible */

	float alpha = 1. - .6 * isReflexion;
	alpha *= mix(1., smoothstep(85., 100., length(vPosition.xz)) + smoothstep(80., 40., length(vPosition.xz)), isReflexion);
	alpha *= mix(1., smoothstep(120., 40., vPosition.y), isReflexion);

	float growTransition = smoothstep(0.1, 0.0, .6 * uTransition - .6 + vUv.y);
	growTransition *= smoothstep(1., 0.9, uTransition);
	float fadeTransition = smoothstep(0.2, 0., uTransition - .2 * vUv.y);
	alpha *= mix(fadeTransition, growTransition, uTransitionDirection);
	alpha *= smoothstep(1., .5, uChapter);

	

	gl_FragColor = vec4(color, alpha);
}`;
