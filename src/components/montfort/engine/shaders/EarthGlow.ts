/* EarthGlow material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

uniform mat4 secondaryProjectionMatrix;
uniform mat4 secondaryViewMatrix;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vPosition;

void main() {
	vec4 mvPosition = secondaryViewMatrix * modelMatrix * vec4(position, 1.0);
	gl_Position = secondaryProjectionMatrix * mvPosition;

	vPosition = position;
    vViewPosition = -mvPosition.xyz;
	mat3 normalMat = mat3(inverse(transpose(secondaryViewMatrix * modelMatrix)));
	vNormal = vec3(normalMat * normal);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform vec3 uGlowColor;

uniform vec3 uSunPosition;

uniform sampler2D tNoise;
uniform sampler2D tMouseComputation;
uniform sampler2D tAlbedo, tData;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
    vec3 lightDir = normalize(uSunPosition - vPosition);
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);

    float diffuse = max(dot(N, lightDir), 0.0);
    float d = pow(clamp(dot(N, V), 0., 1.), 2.);

    float width = .0;
    float fadeStart = .05;
    float fadeEnd = .03;
    float fresnel = smoothstep(.0, fadeStart, d) * smoothstep(fadeEnd + fadeStart + width, fadeStart + width, d) * .5;
    fresnel *= diffuse;

    vec3 color = uGlowColor;
    gl_FragColor = vec4(color, fresnel);
}`;
