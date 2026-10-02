/* BoatMaritime material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

varying vec2 vUv;

void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);

	vUv = uv;
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tMap;
uniform float uChapter;

varying vec2 vUv;

void main() {

    vec4 map = linearToOutputTexel(texture2D(tMap, vUv));

    map.rgb = mix(map.rgb, vec3(0.00784313725490196, 0.10588235294117647, 0.17254901960784313), smoothstep(1.5, 2., uChapter) * .3);

    gl_FragColor = map;
}`;
