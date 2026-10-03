/* HomepagePeaks material shaders from the original site (three.js r169 GLSL), plus the blocks marked "Realism". */

/** "/// #replace <target>" blocks injected into the PBR fragment shader. */
export const fragmentChunks = /* glsl */ `/// #replace #define SIXTY_UNIFORMS_AREA
#define SIXTY_UNIFORMS_AREA
uniform float uTransition, uTime;
uniform vec2 uResolution;
uniform float uFogNear, uFogFar;
uniform vec3 uLightColor, uTransitionColor;
uniform sampler2D tMouse, tNoise, tPerlin, tRock;
varying vec3 vPosition;

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

vec2 dHdxy_fwd(sampler2D textureSampler, vec2 uv, float strength) {
	vec2 dSTdx = dFdx(vUv);
	vec2 dSTdy = dFdy(vUv);

	float Hll = strength * texture2D(textureSampler, uv).r;
	float dBx = strength * texture2D(textureSampler, uv + dSTdx).r - Hll;
	float dBy = strength * texture2D(textureSampler, uv + dSTdy).r - Hll;

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

/// #replace #define SIXTY_START_AREA
#define SIXTY_START_AREA

float transition = smoothstep(0., 0.2, uTransition);

/// #replace #define SIXTY_MAP_AREA
 #define SIXTY_MAP_AREA

vec2 sUv = gl_FragCoord.xy / uResolution;
float mouse = clamp(texture2D(tMouse, sUv).r, 0., 1.);
vec3 windySnow = texture2D(tPerlin, vec2(1., 7.) * vUv + vec2(- .07 * uTime, 0.)).rgb ;
windySnow = smoothstep(.6, .8, windySnow);
windySnow *= .3 * mouse + smoothstep(.5, 1., texture2D(tNoise, vec2(1., 1.5) * vUv + vec2(-.05 * uTime, 0.)).rgb);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.), windySnow); 

/// #replace #define SIXTY_NORMAL_AREA
#define SIXTY_NORMAL_AREA

normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(tPerlin, 6. * vUv, 2.));

/* Realism: bare rock on the steep faces (snow slides off), with snow kept on its ledges */
vec3 worldGeometryNormal = normalize((vec4(normalize(vNormal), 0.) * viewMatrix).xyz);
float cliffs = worldGeometryNormal.y + .3 * (texture2D(tNoise, vUv * 9.).r - .5) + .12 * (texture2D(tNoise, vUv * 37.).r - .5);
cliffs = smoothstep(.53, .47, cliffs);
vec3 rockAlbedo = adjustSaturation(texture2D(tRock, vUv * vec2(3., 8.)).rgb, .4) * vec3(.8, .89, 1.);
rockAlbedo = max(vec3(0.), (rockAlbedo - .3) * 1.5 + .3) * .95;
float ledges = smoothstep(.6, .82, normalize((vec4(normal, 0.) * viewMatrix).xyz).y);
diffuseColor.rgb *= mix(vec3(1.), rockAlbedo, cliffs * (1. - .85 * ledges) * (1. - transition));

/// #replace gl_FragColor = vec4(outgoingLight, diffuseColor.a);

float depth = computeDepth(gl_FragCoord.z, uFogNear, uFogFar);
depth = smoothstep(0.01, .6, depth);
depth *= 1. - transition;
outgoingLight = mix(outgoingLight, uLightColor, depth);

diffuseColor.a *= smoothstep(-.8, 1., vPosition.y);
diffuseColor.a *= 1. - transition;
gl_FragColor = vec4(outgoingLight, diffuseColor.a);`;

/** "/// #replace <target>" blocks injected into the PBR vertex shader. */
export const vertexChunks = /* glsl */ `/// #replace #define SIXTY_UNIFORMS_AREA
#define SIXTY_UNIFORMS_AREA

uniform float uChapter;
varying vec3 vPosition;

/// #replace #define SIXTY_TRANSFORMED_AREA
#define SIXTY_TRANSFORMED_AREA
transformed.y -= uChapter * 1.5;
vPosition = transformed;`;
