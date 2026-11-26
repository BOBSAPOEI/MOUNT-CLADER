/* SeaRock material shaders, verbatim from the original site (three.js r169 GLSL). */

/** "/// #replace <target>" blocks injected into the PBR fragment shader. */
export const fragmentChunks = /* glsl */ `/// #replace #define SIXTY_UNIFORMS_AREA
#define SIXTY_UNIFORMS_AREA

uniform vec3 uLightColor, uTransitionColor;
uniform sampler2D tNoise, tPerlin;
uniform float uTransition, uFogNear, uFogFar, uTime;
varying vec3 vWorldPosition;

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

vec2 dHdxy_fwd(sampler2D textureSampler, vec2 uv) {
	vec2 dSTdx = dFdx(vUv);
	vec2 dSTdy = dFdy(vUv);

	float Hll = 1. * texture2D(textureSampler, uv).r;
	float dBx = 1. * texture2D(textureSampler, uv + dSTdx).r - Hll;
	float dBy = 1. * texture2D(textureSampler, uv + dSTdy).r - Hll;

	return vec2(dBx, dBy);
}

vec3 perturbNormalArb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy) {
	vec3 vSigmaX = dFdx(surf_pos.xyz);
	vec3 vSigmaY = dFdy(surf_pos.xyz);
	vec3 vN = surf_norm;
	vec3 R1 = cross(vSigmaY, vN);
	vec3 R2 = cross(vN, vSigmaX);
	float fDet = dot(vSigmaX, R1);
	vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
	return normalize(abs(fDet) * surf_norm - vGrad);
}

/// #replace #define SIXTY_NORMAL_AREA
#define SIXTY_NORMAL_AREA

normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(tNoise, 6. * vUv));

float wet = smoothstep(-24., -25.2, vWorldPosition.y + .3 * texture2D(tNoise, vUv * 5.).r);
roughness = mix(roughness, 0.2, wet);
diffuseColor.rgb *= 5. * (1. - wet);

float splashZone = smoothstep( -26.5, -24.8, vWorldPosition.y);
float splasher = vWorldPosition.z + vWorldPosition.x;
float splash = sin(0.4 * splasher + uTime) * sin(splasher + .1 * uTime) * smoothstep(-1., 1., sin(splasher * 0.3 + 2. * uTime));

splash = smoothstep(-2., 1., splash);
diffuseColor.rgb += smoothstep(-26.5 + 1.5 * splash, -26.8 + .8 * splash, vWorldPosition.y + 2. * (texture2D(tNoise, vUv * 8. + .05 * uTime).r - .5));

/// #replace vec3 totalEmissiveRadiance = uEmissive;
vec3 totalEmissiveRadiance = uEmissive;

totalEmissiveRadiance += smoothstep(0.7, 0.2, splashZone);

/// #replace gl_FragColor = vec4(outgoingLight, diffuseColor.a);

float depth = computeDepth(gl_FragCoord.z, uFogNear, uFogFar);
depth = smoothstep(0.01, .15, depth);

gl_FragColor = vec4(outgoingLight, diffuseColor.a);

/// #replace gl_FragColor = linearToOutputTexel(gl_FragColor);
gl_FragColor = linearToOutputTexel(gl_FragColor);

gl_FragColor.rgb = mix(gl_FragColor.rgb, uLightColor, depth);
gl_FragColor.a = mix(gl_FragColor.a, 0., smoothstep(0.3, .7, uTransition));`;

/** "/// #replace <target>" blocks injected into the PBR vertex shader. */
export const vertexChunks = /* glsl */ `/// #replace #define SIXTY_UNIFORMS_AREA
#define SIXTY_UNIFORMS_AREA

varying vec3 vWorldPosition;

/// #replace mvPosition = modelViewMatrix * mvPosition;
mvPosition = modelMatrix * mvPosition;
vWorldPosition = mvPosition.xyz;
mvPosition = viewMatrix * mvPosition;`;
