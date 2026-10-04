/* CapitalForeground material shaders, verbatim from the original site (three.js r169 GLSL). */

/** "/// #replace <target>" blocks injected into the PBR fragment shader. */
export const fragmentChunks = /* glsl */ `/// #replace #define SIXTY_UNIFORMS_AREA

#define SIXTY_UNIFORMS_AREA

uniform float uTime, uChapter, uTransition;
uniform vec3 uLightColor, uDarkColor, uTransitionColor, uCapitalFog;
uniform vec2 uResolution;
uniform sampler2D tReflexion, tVoronoi, tGrass, tNoiseNormal, tNoise;

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

	float Hll = .2 * texture2D(textureSampler, uv).r;
	float dBx = .2 * texture2D(textureSampler, uv + dSTdx).r - Hll;
	float dBy = .2 * texture2D(textureSampler, uv + dSTdy).r - Hll;

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

vec3 hueShift(vec3 color, float hue) {
	vec3 k = vec3(0.57735, 0.57735, 0.57735);
	float cosAngle = cos(hue);
	return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

vec3 adjustSaturation(vec3 color, float saturation) {
	return mix(vec3(dot(color, vec3(0.2125, 0.7154, 0.0721))), color, saturation);
}

/// #replace vec4 baseColorMapSample = texture2D(tMap, vMapUv);
vec4 baseColorMapSample = texture2D(tMap, vMapUv + 0.02 * (texture2D(tNoise, vUv * 30.).rg - .5));
float depth = computeDepth(gl_FragCoord.z, 0.01, 50.);
float shadow = smoothstep(0.03, 0.07, depth);

/// #replace #define SIXTY_MAP_AREA
#define SIXTY_MAP_AREA

diffuseColor.rgb *= 1. + 1.5 * smoothstep(100., 2., vViewPosition.z);

vec2 bigNoise = texture2D(tNoise, vEmissiveMapUv).rg - .5;
vec2 lakeUv = 0.09 * (bigNoise) + vec2(.7, 1.) * vEmissiveMapUv - vec2(0.16, .38);
lakeUv += .05 * (texture2D(tNoise, 8. * vEmissiveMapUv).rg - .5) * smoothstep(.1, - 0.3, bigNoise);
float laker = length(lakeUv);
float lake = smoothstep(0.0845, 0.085, laker);
diffuseColor.a *= lake;
diffuseColor.rgb *= 1. + .7 * smoothstep(0.095, 0.08, laker);
diffuseColor.rgb *= mix(vec3(1.), 2. * vec3(.14, .28, .18), smoothstep(0.085, 0.084, laker));

vec3 flowers = vec3(1., 0.21, 0.05);

vec3 grass = texture2D(tGrass, vEmissiveMapUv * 30.).rgb;
flowers = hueShift(flowers, - 5. * bigNoise.r);
vec3 moss = mix(.3 * grass, flowers, smoothstep(0.46, 0.55, texture2D(tNoise, vUv * 8.).r) * smoothstep(0.2, 0.4, texture2D(tVoronoi, 3. * bigNoise + vEmissiveMapUv * 80.).r));

diffuseColor.rgb = adjustSaturation(diffuseColor.rgb, 0.9);
diffuseColor.rgb = hueShift(diffuseColor.rgb, bigNoise.g * 1.5);

float grassZone = smoothstep(0., .2, vEmissiveMapUv.x); 

diffuseColor.a *= smoothstep(0.35, .32, vEmissiveMapUv.x - .12 * smoothstep(0., .8, vEmissiveMapUv.y)) + smoothstep(0.5, .51, vEmissiveMapUv.x);
diffuseColor.rgb = mix(hueShift(.4 * grass, .2), diffuseColor.rgb, grassZone);

/* Mountain shadow*/
float mtnShadow = length(vEmissiveMapUv - vec2(.55, .65));
diffuseColor.rgb *= smoothstep(-0.1, .35, mtnShadow);

diffuseColor.rgb *= 1. + 0.9 * (40. * texture2D(tEmissiveMap, vEmissiveMapUv).rgb);

diffuseColor.rgb *= 1. - 3. * shadow;

/// #replace #define SIXTY_NORMAL_AREA
#define SIXTY_NORMAL_AREA

normal = mix(normal, perturbNormalArb(- vViewPosition, normal, dHdxy_fwd(tGrass, 20. * vUv)), 1.);

metallic = 1.;

/// #replace gl_FragColor = vec4(outgoingLight, diffuseColor.a);

float capitalNoise = texture2D(tNoise, 0.002 * (vWorldPosition.zy * vec2(1., 2.) + 2. * uTime)).r - .5;
outgoingLight = mix(outgoingLight, mix(uLightColor, uDarkColor, 0.7), .1 * smoothstep(10., 40., vWorldPosition.y + 10. * capitalNoise));

float capitalFog = smoothstep(0.2, 0.8, texture2D(tNoise, 0.001 * vec2(1., 3.) * vWorldPosition.zy - .001 * uTime).r);
capitalFog *= smoothstep(0., -40., vWorldPosition.y + 40. * capitalNoise);
capitalFog *= smoothstep(-200., -190., vWorldPosition.x);
outgoingLight = mix(outgoingLight, uCapitalFog, .5 * capitalFog);

diffuseColor.a += .5 * capitalFog;

outgoingLight = mix(outgoingLight, uLightColor, depth);

outgoingLight = mix(outgoingLight, uTransitionColor, smoothstep(0., 0.5, uTransition));

float mountainDistance = smoothstep(300., 100., length(vec3(-vWorldPosition.x, 0., vWorldPosition.z)));
diffuseColor.a *= smoothstep(1. , 0.9, uTransition);
diffuseColor.a *= smoothstep(2., 1.5, uChapter);

gl_FragColor = vec4(outgoingLight, diffuseColor.a);`;

/** "/// #replace <target>" blocks injected into the PBR vertex shader. */
export const vertexChunks = /* glsl */ `/// #replace #define SIXTY_UNIFORMS_AREA
#define SIXTY_UNIFORMS_AREA

varying vec3 vWorldPosition;

/// #replace mvPosition = modelViewMatrix * mvPosition;
mvPosition = modelMatrix * mvPosition;
vWorldPosition = mvPosition.xyz;
mvPosition = viewMatrix * mvPosition;`;
