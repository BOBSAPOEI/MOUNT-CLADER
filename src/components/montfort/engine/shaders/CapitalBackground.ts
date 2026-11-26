/* CapitalBackground material shaders, verbatim from the original site (three.js r169 GLSL). */

export const fragmentShader = /* glsl */ `precision highp float;

uniform float uTransition, uTime;
uniform vec2 uResolution;
uniform vec3 uLightColor, uDarkColor, uTransitionColor, uCapitalFog, uSunProjected;
uniform sampler2D tNoise, tMap;
varying vec2 vUv;
varying vec3 vWorldPosition;

vec3 adjustSaturation(vec3 color, float saturation) {
	return mix(vec3(dot(color, vec3(0.2125, 0.7154, 0.0721))), color, saturation);
}

float viewZToOrthographicDepth(const in float viewZ, const in float near, const in float far) {
	return (viewZ + near) / (near - far);
}
float perspectiveDepthToViewZ(const in float invClipZ, const in float near, const in float far) {
	return (near * far) / ((far - near) * invClipZ - far);
}
float computeDepth(float fragCoordZ, float near, float far) {
	float viewZ = perspectiveDepthToViewZ(fragCoordZ, near, far);
	return viewZToOrthographicDepth(viewZ, near, far);
}
vec3 hueShift(vec3 color, float hue) {
    vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(hue);
    return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

void main() {

	vec2 sUv = gl_FragCoord.xy / uResolution;
	vec2 dUv = vUv + 0.04 * (texture2D(tNoise, vUv * 5. * vec2(1., 5.)).rg - .5);
	vec4 map = texture2D(tMap, dUv);
	
	map.rgb *= 0.3 + 0.8 * smoothstep(.8, 0.5, vUv.x + 0.3 * (texture2D(tNoise, vec2(1., 3.) * vUv).r - .5));
	map.rgb = hueShift(map.rgb, .15);
	map.rgb = adjustSaturation(map.rgb, 1.5);

	float depth = computeDepth(gl_FragCoord.z, 0.01, 120.);

	float capitalNoise = texture2D(tNoise, 0.0005 * (vWorldPosition.zy * vec2(1., 2.) + 2. * uTime)).r - .5;
	map.rgb = mix(map.rgb, mix(uLightColor, uDarkColor, 0.7), .1 * smoothstep(10., 40., vWorldPosition.y + 10. * capitalNoise));
	
	float capitalFog = smoothstep(0.2, 0.8, texture2D(tNoise, 0.001 * vec2(1., 3.) * vWorldPosition.zy - .001 * uTime).r);
	capitalFog *= smoothstep(15., -40., vWorldPosition.y + 40. * capitalNoise);
	map.rgb = mix(map.rgb, uCapitalFog, .5 * capitalFog);

	vec2 sunProjected = uSunProjected.xy * .5 + .5;
	sunProjected.y += .2;
	map.rgb = mix(map.rgb, uLightColor,0.4 *  smoothstep(0.3, 0., length(sUv - sunProjected))); 

	map.rgb = mix(map.rgb, uLightColor, depth);

	map.rgb = mix(map.rgb, uTransitionColor, smoothstep(0., 0.5, uTransition));

	map.a *= smoothstep(.8 , 0., uTransition);

	gl_FragColor = map;

	gl_FragColor = linearToOutputTexel(gl_FragColor);
}`;

export const vertexShader = /* glsl */ `precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
	vUv = uv;
	vec4 mvPosition = modelMatrix * vec4(position, 1.0);
	vWorldPosition = mvPosition.xyz;
	gl_Position = projectionMatrix * viewMatrix * mvPosition;
}`;
