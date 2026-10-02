/* Mountain material shaders, verbatim from the original site (three.js r169 GLSL). */

export const fragmentShader = /* glsl */ `precision highp float;

uniform vec3 uColor;

uniform sampler2D tMap;
varying vec2 vMapUv;

uniform sampler2D tMap2;
varying vec2 vMap2Uv;

uniform float uMetalness;
uniform float uRoughness;

uniform sampler2D tArmMap;
varying vec2 vArmMapUv;

uniform vec3 uAmbient;
uniform float uAmbientIntensity;

uniform sampler2D tNormalMap;
varying vec2 vNormalMapUv;
uniform vec2 uNormalScale;

#ifdef SIXTY_ENVMAP
uniform sampler2D tEnvMap;
uniform mat3 uEnvMapRotation;
uniform float uEnvMapIntensity;
#endif

varying vec2 vUv;

uniform mat3 normalMatrix;
varying vec3 vNormal;
varying vec3 vWorldPosition, vViewPosition;

#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535

#ifndef saturate
	#define saturate(a) clamp(a, 0.0, 1.0)
#endif

struct ReflectedLight {
	vec3 directDiffuse; 
	vec3 directSpecular; 
	vec3 indirectDiffuse; 
	vec3 indirectSpecular; 
};

struct PBRMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
};

#ifdef SIXTY_ENVMAP
	vec3 inverseTransformDirection(vec3 dir, mat4 matrix) {
		return normalize((vec4(dir, 0.0) * matrix).xyz);
	}
	
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace(vec3 direction) {
		vec3 absDirection = abs(direction);
		float face = - 1.0;
		if (absDirection.x > absDirection.z) {
			if (absDirection.x > absDirection.y)
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if (absDirection.z > absDirection.y)
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}

		return face;

	}

	vec2 getUV(vec3 direction, float face) {
		vec2 uv;
		if (face == 0.0) {
			uv = vec2(direction.z, direction.y) / abs(direction.x);
		} else if (face == 1.0) {
			uv = vec2(- direction.x, - direction.z) / abs(direction.y);
		} else if (face == 2.0) {
			uv = vec2(- direction.x, direction.y) / abs(direction.z);
		} else if (face == 3.0) {
			uv = vec2(- direction.z, direction.y) / abs(direction.x);
		} else if (face == 4.0) {
			uv = vec2(- direction.x, direction.z) / abs(direction.y);
		} else {
			uv = vec2(direction.x, direction.y) / abs(direction.z);
		}
		return 0.5 * (uv + 1.0);
	}

	vec3 bilinearCubeUV(sampler2D envMap, vec3 direction, float mipInt) {
		float face = getFace(direction);

		float filterInt = max(cubeUV_minMipLevel - mipInt, 0.0);
		mipInt = max(mipInt, cubeUV_minMipLevel);
		float faceSize = exp2(mipInt);
		highp vec2 uv = getUV(direction, face) * (faceSize - 2.0) + 1.0;
		if (face > 2.0) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * (exp2(CUBEUV_MAX_MIP) - faceSize);
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;

		return texture2D(envMap, uv).rgb;
	}

	#define cubeUV_r0 1.0
	#define cubeUV_m0 -2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 -1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0

	float roughnessToMip(float roughness) {
		float mip = 0.0;

		if (roughness >= cubeUV_r1) {
			mip = (cubeUV_r0 - roughness) * (cubeUV_m1 - cubeUV_m0) / (cubeUV_r0 - cubeUV_r1) + cubeUV_m0;
		} else if (roughness >= cubeUV_r4) {
			mip = (cubeUV_r1 - roughness) * (cubeUV_m4 - cubeUV_m1) / (cubeUV_r1 - cubeUV_r4) + cubeUV_m1;
		} else if (roughness >= cubeUV_r5) {
			mip = (cubeUV_r4 - roughness) * (cubeUV_m5 - cubeUV_m4) / (cubeUV_r4 - cubeUV_r5) + cubeUV_m4;
		} else if (roughness >= cubeUV_r6) {
			mip = (cubeUV_r5 - roughness) * (cubeUV_m6 - cubeUV_m5) / (cubeUV_r5 - cubeUV_r6) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2(1.16 * roughness);		
		}

		return mip;
	}

	vec4 textureCubeUV(sampler2D envMap, vec3 sampleDir, float roughness) {
		float mip = clamp(roughnessToMip(roughness), cubeUV_m0, CUBEUV_MAX_MIP);
		float mipF = fract(mip);
		float mipInt = floor(mip);
		vec3 color0 = bilinearCubeUV(envMap, sampleDir, mipInt);
		if((mipF == 0.0)) {
			return vec4(color0, 1.0);
		} else {
			vec3 color1 = bilinearCubeUV(envMap, sampleDir, (mipInt + 1.0));
			return vec4(mix(color0, color1, mipF), 1.0);
		}
	}

	vec3 getIBLIrradiance(const in vec3 normal, const in sampler2D envMap, const in float envMapIntensity, const in mat3 envMapRotation) {
    	vec3 worldNormal = inverseTransformDirection(normal, viewMatrix);
		vec4 envMapColor = textureCubeUV(envMap, envMapRotation * worldNormal, 1.0);
		return PI * envMapColor.rgb * envMapIntensity;

	}

	vec3 getIBLRadiance(const in vec3 viewDir, const in vec3 normal, const in float roughness, const in sampler2D envMap, const in float envMapIntensity, const in mat3 envMapRotation) {
		vec3 reflectVec = reflect(- viewDir, normal);
		reflectVec = normalize(mix(reflectVec, normal, roughness * roughness));
		reflectVec = inverseTransformDirection(reflectVec, viewMatrix);
		vec4 envMapColor = textureCubeUV(envMap, envMapRotation * reflectVec, roughness);

		return envMapColor.rgb * envMapIntensity;
	}

#endif
vec3 getAmbientLightIrradiance(vec3 ambientLightColor) {
    vec3 irradiance = ambientLightColor;
    return irradiance;
}

vec3 BRDF_Lambert(const in vec3 diffuseColor) {
	return RECIPROCAL_PI * diffuseColor;
}

void RE_IndirectDiffuse(const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in PBRMaterial pbrMaterial, inout ReflectedLight reflectedLight) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert(pbrMaterial.diffuseColor);
}

vec2 DFGApprox(const in vec3 normal, const in vec3 viewDir, const in float roughness) {
	float dotNV = saturate(dot(normal, viewDir));
	const vec4 c0 = vec4(- 1, - 0.0275, - 0.572, 0.022);
	const vec4 c1 = vec4(1, 0.0425, 1.04, - 0.04);
	vec4 r = roughness * c0 + c1;
	float a004 = min(r.x * r.x, exp2(- 9.28 * dotNV)) * r.x + r.y;
	vec2 fab = vec2(- 1.04, 1.04) * a004 + r.zw;
	return fab;
}

void computeMultiscattering(const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter) {
	vec2 fab = DFGApprox(normal, viewDir, roughness);
	vec3 Fr = specularColor;
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + (1.0 - Fr) * 0.047619;	vec3 Fms = FssEss * Favg / (1.0 - Ems * Favg);

	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}

void RE_IndirectSpecular(const in vec3 radiance, const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in PBRMaterial pbrMaterial, inout ReflectedLight reflectedLight) {
	vec3 singleScattering = vec3(0.);
	vec3 multiScattering = vec3(0.);

	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	
	computeMultiscattering(geometryNormal, geometryViewDir, pbrMaterial.specularColor, pbrMaterial.specularF90, pbrMaterial.roughness, singleScattering, multiScattering);
	
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = pbrMaterial.diffuseColor * (1. - max(max(totalScattering.r, totalScattering.g), totalScattering.b));
	
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}

float computeSpecularOcclusion(const in float dotNV, const in float ambientOcclusion, const in float roughness) {
	return saturate(pow(dotNV + ambientOcclusion, exp2(- 16.0 * roughness - 1.0)) - 1.0 + ambientOcclusion);
}

mat3 getTangentFrame(const in vec3 eyePos, const in vec3 surfaceNormal, const in vec2 uv) {
	vec3 posDx = dFdx(eyePos);
	vec3 posDy = dFdy(eyePos);

	vec2 uvDx = dFdx(uv);
	vec2 uvDy = dFdy(uv);

	uvDx = max(uvDx, vec2(1e-2));
	uvDy = max(uvDy, vec2(1e-2));

	uvDx = min(uvDx, vec2(1.));
	uvDy = min(uvDy, vec2(1.));

	vec3 N = surfaceNormal;

	vec3 q1perp = cross(posDy, N);
	vec3 q0perp = cross(N, posDx);

		
	vec3 T = q1perp * uvDx.x + q0perp * uvDy.x;
	vec3 B = q1perp * uvDx.y + q0perp * uvDy.y;

	float det = max(dot(T, T), dot(B, B));
	float scale = (det == 0.0) ? 0.0 : inversesqrt(det);

	return mat3(T * scale, B * scale, N);
}
#define SIXTY_UNIFORMS_AREA

vec2 rotateUV(vec2 uv, vec2 mid, float rotation) {

	return vec2(cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x, cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y);
}
uniform vec2 uResolution;
uniform vec3 uLightColor, uDarkColor, uTransitionColor, uCapitalFog;
uniform float uTransition, uTransitionDirection, uChapter, uPage, uFogNear, uFogFar, uTime;
uniform sampler2D tMixMap, tRandom, tNoise, tNoiseNormal, tPerlin, tVoronoi, tMouse, tRockNormal;

varying vec3 vPosition;

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
vec3 adjustSaturation(vec3 color, float saturation) {
	return mix(vec3(dot(color, vec3(0.2125, 0.7154, 0.0721))), color, saturation);
}

float createGrid(vec2 uv, float gridSize, vec2 uvDeriv, float lineWidth, float intensity) {
	vec2 targetWidth = vec2(lineWidth);
	vec2 drawWidth = clamp(vec2(targetWidth), uvDeriv, vec2(0.5));
	vec2 lineAA = uvDeriv * 1.5;

	vec2 gridUV = abs(fract(uv * gridSize + 0.5) * 2.0 - 1.0);
	vec2 grid2 = smoothstep(drawWidth + lineAA + .1, drawWidth - lineAA - .1, gridUV);

	
	vec2 diagUV = rotateUV(uv, vec2(0.), PI / 4.);
	diagUV = abs(fract(diagUV * gridSize / sqrt(2.) + 0.5) * 2.0 - 1.0);
	vec2 gridDiag = smoothstep(drawWidth + lineAA + .1, drawWidth - lineAA - .1, diagUV);

	grid2 *= saturate(targetWidth / drawWidth) * intensity;
	grid2 = mix(grid2, targetWidth, saturate(uvDeriv * 2.0 - 1.0));

	float grid = mix(grid2.x, 1.0, grid2.y);
	float diagonal = gridDiag.y * intensity;

	return max(grid, diagonal);
}

void main() {
	vec2 sUv = gl_FragCoord.xy / uResolution;

	float homepage = 1. - step(0.5, uPage);
	float trading = step(0.5, uPage) * (1. - step(1.5, uPage));
	float capital = step(1.5, uPage) * (1. - step(2.5, uPage));
	float maritime = step(2.5, uPage) * (1. - step(3.5, uPage));
	float fortEnergy = step(3.5, uPage);
	float transition = uTransition;

	transition = uTransition;
	
	float transDir = uTransitionDirection;
	

	
	float transitionSize = (.03 - 0.01 * capital - .01 * (trading)) * 2.;
	float pixelNoise = texture2D(tRandom, vUv * (2. + capital + 2. * trading + homepage)).r;
	pixelNoise *= texture2D(tRandom, vUv * (3. + capital +  2. * trading + homepage) + .5 + .01 * uTime).r;
	pixelNoise -= 1.;
	float mountainHeight = smoothstep(0., 400., length(vPosition - vec3(-20., 65., 3.4)));
	
	float basicNoise = texture2D(tNoise, vUv).r;
	mountainHeight -= .3 * (basicNoise - .5) * smoothstep(1., 0.9, transition) * smoothstep(0., 0.1, transition);
	mountainHeight += .015* pixelNoise;
	float transitionWave = smoothstep(1. - 2. * transitionSize, 1., transition + 1.8 * mountainHeight);
	
	transitionWave = mix(transitionWave, 1., smoothstep(0.99, 1., transition));
	transitionWave = mix(transitionWave, 0., smoothstep(0.01, 0., transition));

	float fadeTransition = mix(smoothstep(0., .2, transition), smoothstep(0.09, .1, transition * .13 + .2 * mountainHeight), fortEnergy);
	transitionWave = mix(fadeTransition, transitionWave, transDir);

	vec2 smallNoise = texture2D(tNoise, vUv * 45.).rg - .5;
	vec2 bigNoise = texture2D(tNoise, vUv * 5.).rg - .5;
	vec4 mouseSample = texture2D(tMouse, sUv + 0.1 * bigNoise * (1. - .8 * trading));
	float mouse = clamp(mouseSample.r, 0., 1.);

	vec4 diffuseColor = vec4(uColor, 1.);

	vec2 dMapUv = vMapUv;
	vec3 normal = normalize(vNormal);

	vec4 baseColorMapSample = vec4(.98, .98, 1., 1.);
	if(uPage > 2.5) {
		baseColorMapSample = texture2D(tMap, dMapUv);
	}

	vec4 secondColorMapSample = texture2D(tMap2, vMap2Uv);

	secondColorMapSample.rgb = mix(secondColorMapSample.rgb, mix(vec3(0.36, 0.47, 0.52), vec3(1.), secondColorMapSample.r), homepage);

	vec4 mixMapSample = texture2D(tMixMap, vec2(vUv.x, 1. - vUv.y) + 0.002 * smallNoise);

			/* HOMEPAGE & TRADING */
	vec4 hoTraSample = mix(1.3 * secondColorMapSample, baseColorMapSample, mixMapSample.r);

			/** CAPITAL **/
	vec4 capitalSample = mix(secondColorMapSample * .6, baseColorMapSample, mixMapSample.r);

	capitalSample.rgb = hueShift(capitalSample.rgb, 0.2 + 1.8 * (texture2D(tNoise, vUv * 2.2).r - .5));
	capitalSample.rgb *= 1. + .3 * smoothstep(.4, .6, texture2D(tNoise, vUv * 2.9).r);

	vec3 lilGrass = texture2D(tMap2, vUv * 8.).rgb;
	float lilFactor = smoothstep(.7, 1., texture2D(tPerlin, vUv * 5.).r);
	capitalSample.rgb = mix(capitalSample.rgb, lilGrass, lilFactor);
	vec4 moss = capitalSample * 0.6;
	vec4 flowers = vec4(1., 0.21, 0.05, 1.);
	flowers.rgb = hueShift(flowers.rgb, -5. * bigNoise.r);
	moss = mix(moss, flowers, smoothstep(0.24, 0.3, texture2D(tVoronoi, vUv * 6. + bigNoise).r) * smoothstep(0.2, 0.55 - .1 * mouse, texture2D(tVoronoi, vUv * 120.).r));
	float mossZone = mixMapSample.r + max(0., mouse);
	mossZone += smoothstep(-10., -25., vPosition.y + .1 * vPosition.z + 10. * bigNoise.r);
	capitalSample = mix(capitalSample, moss, clamp(mossZone, 0., 1.));
	float bottom = smoothstep(-18., -35., vPosition.y + .1 * vPosition.z + 10. * bigNoise.r);
	capitalSample.rgb = hueShift(capitalSample.rgb, -.5 * bottom);
	capitalSample *= 1. - .8 * bottom;
	
	capitalSample.rgb *= .5 + .8 * texture2D(tNoise, vec2(16., 1.) * vUv).r * smoothstep(.3, .5, texture2D(tNoise, 2. * vUv).r);
	capitalSample.rgb = adjustSaturation(capitalSample.rgb, 1.1);

		/** MARITIME **/
	float mixMaritime = smoothstep(-.5, .8, normal.r);
	
	vec4 maritimeSample = mix(vec4(adjustSaturation(baseColorMapSample.rgb, 2.), 1.), secondColorMapSample * vec4(.8, .7, .8, 1.), mixMaritime);
	maritimeSample.rgb *= 0.1 + .9 * smoothstep(-22., -15., vPosition.y + smallNoise.r * 5.);

	/* Maritime splashes */
	vec3 totalEmissiveRadiance = vec3(0.);
	if(maritime == 1.) {
		float splashZone = smoothstep(-23.8, -20.2, vPosition.y);
		float splasher = vPosition.z + vPosition.x;
		float splash = sin(0.4 * splasher + uTime) * sin(splasher + .1 * uTime) * smoothstep(-1., 1., sin(splasher * 0.3 + 2. * uTime));

		splash = smoothstep(-2., 1., splash);
		maritimeSample += smoothstep(-22.9 + 1.5 * splash, -23.8 + .8 * splash, vPosition.y + 2. * (texture2D(tNoise, vUv * 30. + .05 * uTime).r - .5));

		float foamFog = vPosition.y + 10. * texture2D(tNoise, 2. * vUv - .005 * uTime).r;
		foamFog = smoothstep(-14.2, -23.8, foamFog);
		totalEmissiveRadiance += .3 * foamFog;

		totalEmissiveRadiance += smoothstep(0.5, 0.1, splashZone) * (1. - transitionWave);
	}

	baseColorMapSample = mix(baseColorMapSample, hoTraSample, homepage + trading);
	baseColorMapSample = mix(baseColorMapSample, capitalSample, capital);
	baseColorMapSample = mix(baseColorMapSample, maritimeSample, maritime);

	diffuseColor *= baseColorMapSample;

	
	vec4 armSample = vec4(1);

	armSample = texture2D(tArmMap, vec2(vArmMapUv.x, 1. - vArmMapUv.y) + 0.005 * (texture2D(tNoise, vUv * 80.).rg - .5));
	vec3 capitalLightmap = armSample.rgb;
	
	capitalLightmap = mix(vec3(0.2, .2, 0.1), vec3(.97, .8, 0.5), capitalLightmap.r);
	capitalLightmap *= 1. + 2.8 * smoothstep(0.6, 1., armSample.rgb) * capital;
	

	armSample *= 3. - 2. * maritime;
	armSample += smoothstep(0.2, 0.7, armSample) * (.3 + 2.5 * maritime);

	vec3 homepageLightmap = mix(vec3(0.36, 0.47, 0.52), vec3(1.), smoothstep(0.2, .9, armSample.r));

	vec3 tradingLight = mix(vec3(1., .5, 0.2), vec3(0.35, 0.34, 0.5), smoothstep(40., 20., vPosition.y));
	vec3 tradingLightmap = armSample.rgb;
	tradingLightmap *= mix(vec3(0.05, .18, .25) * .5, tradingLight, smoothstep(.2, 1.1, armSample.r));

	armSample.rgb = mix(armSample.rgb, homepageLightmap, homepage);
	armSample.rgb = mix(armSample.rgb, capitalLightmap, capital);
	armSample.rgb = mix(armSample.rgb, tradingLightmap, trading);

	float roughness = clamp(uRoughness, 0.04, 1.0);
	float metallic = clamp(uMetalness, 0.04, 1.0);

	vec3 nonPerturbatedNormal = vNormal;

	vec3 transitionNormal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(tPerlin, vUv * 10., 5.));

		/* Rock Normal */
	mat3 tbn2 = getTangentFrame(-vViewPosition, normal, vNormalMapUv);
	vec3 nTex2 = texture2D(tRockNormal, vNormalMapUv * 30.).rgb * 2. - 1.;
	nTex2.xy *= mix((2. + (4. * trading)) * (1. - mixMapSample.r * (homepage + trading)), 0.3 + .4 * mouse, capital);
	normal = normalize(tbn2 * nTex2);

	#define SIXTY_NORMALMAP_AREA
	vec3 perturbedNormal = normal;
		/* Windy snow */
	vec2 windUv = vUv;
	windUv = rotateUV(windUv, vec2(1., 7.), 2.7 + .3 * trading);
	windUv *= vec2(1., 7.);
	
	vec3 windySnow = texture2D(tPerlin, windUv + vec2(0.03 * uTime, 0.)).rgb;
	windySnow = smoothstep(.5, 1., windySnow);
	windySnow *= mix(1., mixMapSample.r, trading);
	float snowCloud = texture2D(tNoise, vec2(.8, .3) * windUv + vec2(0.02 * uTime, -0.02 * uTime)).r;
	windySnow *= .2 * mouse + smoothstep(.45, 1., snowCloud); 
	diffuseColor.rgb += 1.1 * windySnow * (1. - transitionWave) * (1. - step(1.5, uPage));

	if(uPage < 1.5) {
		perturbedNormal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(tPerlin, vUv * 10., 2. * smoothstep(.7, .4, snowCloud)));
		if(trading == 1.) {
			perturbedNormal = perturbNormalArb(-vViewPosition, perturbedNormal, dHdxy_fwd(tPerlin, vec2(4., 12.) * vUv, 9. * (1. - mixMapSample.r)));
		}
	} else {
		perturbedNormal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(tMap2, vUv * 15., 3.5 * (1. - capital * mixMapSample.r)));
		if(maritime == 1.) {
			perturbedNormal = perturbNormalArb(-vViewPosition, perturbedNormal, dHdxy_fwd(tPerlin, vec2(1.) * vMapUv, 20.));
		}
	}

	normal = mix(perturbedNormal, transitionNormal, transitionWave);

	diffuseColor.rgb *= armSample.rgb; /* Lightmap */

	/* Transition */
	vec3 transitionColor = texture2D(tPerlin, vUv * 3.).rgb * 1.;
	transitionColor *= clamp(length(normal.rg), 0.5, 1.);
	
	diffuseColor.rgb = mix(diffuseColor.rgb, transitionColor, transitionWave);
	roughness = mix(roughness, 1., transitionWave);

	#define SIXTY_NORMAL_AREA

	ReflectedLight reflectedLight = ReflectedLight(vec3(0.), vec3(0.), vec3(0.), vec3(0.));

	PBRMaterial pbrMaterial = PBRMaterial(vec3(0.), 0., vec3(0.), 0.);
	pbrMaterial.diffuseColor = diffuseColor.rgb * (1. - metallic);

	vec3 dxy = max(abs(dFdx(nonPerturbatedNormal)), abs(dFdy(nonPerturbatedNormal)));
	float geometryRoughness = max(max(dxy.x, dxy.y), dxy.z);

	pbrMaterial.roughness = max(roughness, 0.0525);
	pbrMaterial.roughness += geometryRoughness;
	pbrMaterial.roughness = min(pbrMaterial.roughness, 1.0);

	pbrMaterial.specularColor = mix(vec3(0.04), diffuseColor.xyz, metallic);
	pbrMaterial.specularF90 = 1.;

	#define SIXTY_PBR_AREA

	vec3 geometryPosition = -vViewPosition;
	vec3 geometryNormal = normal;
	vec3 geometryViewDir = normalize(vViewPosition);

	vec3 ambientLightColor = uAmbient * uAmbientIntensity;
	ambientLightColor = mix(ambientLightColor, vec3(.3), transitionWave);
	

	vec3 iblIrradiance = vec3(0.);
	vec3 radiance = vec3(0.);
	vec3 irradiance = getAmbientLightIrradiance(ambientLightColor);

	#ifdef SIXTY_ENVMAP
	float envMapIntensity = mix(uEnvMapIntensity, .5, transitionWave);

	mat3 envMapRotation = (uEnvMapRotation * (1.0 - transitionWave)) + (mat3(1.) * transitionWave);
	iblIrradiance += getIBLIrradiance(geometryNormal, tEnvMap, envMapIntensity, envMapRotation);
	radiance += getIBLRadiance(geometryViewDir, geometryNormal, pbrMaterial.roughness, tEnvMap, envMapIntensity, envMapRotation);

		
	RE_IndirectDiffuse(irradiance, geometryPosition, geometryNormal, geometryViewDir, pbrMaterial, reflectedLight);
	RE_IndirectSpecular(radiance, iblIrradiance, geometryPosition, geometryNormal, geometryViewDir, pbrMaterial, reflectedLight);

	float occlusion = (armSample.r - 1.) * (1. - transitionWave) + 1.;
		

	float dotNV = saturate(dot(geometryNormal, geometryViewDir));
	reflectedLight.indirectSpecular *= computeSpecularOcclusion(dotNV, occlusion, pbrMaterial.roughness);

	#endif

	/* Transition wave emissive */
	vec3 waveColor = mix(vec3(0.2, .4, 1.), vec3(0.5, 0.85, .85), smoothstep(.2, .7, texture2D(tNoise, vUv * 3. + .04 * uTime).r));
	waveColor = hueShift(waveColor, .2 * sin(vPosition.z * .1 + uTime));
	waveColor *= .8 + .4 * smoothstep(0.3, .9, basicNoise);
	waveColor = mix(waveColor, transitionColor, smoothstep(0., 0.5, pixelNoise + 1.));
	
	totalEmissiveRadiance += transDir * waveColor * clamp(transitionWave - smoothstep(1. - transitionSize, 1., transition + 1.8 * mountainHeight), 0., 1.);
	

	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	vec3 outgoingLight = totalDiffuse + totalSpecular;

	/* Capital color correction */
	if(capital == 1.) {
		vec3 capitalOLight = outgoingLight;
		float capitalNoise = texture2D(tNoise, 0.002 * (vWorldPosition.zy * vec2(1., 2.) + 2. * uTime)).r - .5;
		capitalOLight = mix(capitalOLight, mix(uLightColor, uDarkColor, 0.7), .1 * smoothstep(10., 40., vWorldPosition.y + 10. * capitalNoise));

		float capitalFog = smoothstep(0.2, 0.8, texture2D(tNoise, 0.001 * vec2(1., 3.) * vWorldPosition.zy - .001 * uTime).r);
		capitalFog *= smoothstep(0., -40., vWorldPosition.y + 40. * capitalNoise);

		float stretchedUv = smoothstep(0.1, 0., length(vUv - vec2(.03, .65)));
		capitalOLight = mix(capitalOLight, .1 * vec3(.25, 0.3, 0.03), .7 * stretchedUv);

		capitalOLight = mix(capitalOLight, uCapitalFog, .5 * capitalFog);

		outgoingLight = mix(capitalOLight, outgoingLight, transitionWave);

	}

	/* Desaturate transition color */
	outgoingLight = adjustSaturation(outgoingLight, 1. - transitionWave);
	outgoingLight += totalEmissiveRadiance;

	float depth = computeDepth(gl_FragCoord.z, uFogNear, uFogFar);
	depth = smoothstep(0.01, .3, depth);
	depth *= 1. - transition;
	outgoingLight = mix(outgoingLight, uLightColor, depth);

	float tradingFog = .2 * smoothstep(15., -20., vPosition.y) * trading;
	outgoingLight = mix(outgoingLight, vec3(0., 0.4, .9), .2 * tradingFog);

	/* Mouse wireframe effect Trading */
	float strictTrading = max(0., trading - transition);
	float gridSize = 300.;
	float lineWidth = .03;

	vec4 uvDDXY = vec4(dFdx(sUv), dFdy(sUv));
	vec2 uvDeriv = vec2(length(uvDDXY.xz), length(uvDDXY.yw));

	float grid = createGrid(vUv, 300., uvDeriv, lineWidth * .01, 1.);
	grid = max(grid, createGrid(vUv, 600., uvDeriv, lineWidth, .2));

	vec3 tradingMouse = clamp(outgoingLight + vec3(.01, .01, .02) * 1.3 + .1 * grid, 0., 1.);

	outgoingLight = mix(outgoingLight, tradingMouse, mouseSample.b * strictTrading * (.4 + .6 * mixMapSample.r) * smoothstep(.2, .1, length(vUv - vec2(.67, .4))));

	
	outgoingLight *= (1. - strictTrading * min(1., uChapter));

	

	float alpha = mix(1., smoothstep(302., 301.5, vViewPosition.z), fortEnergy); /* backsides */
	alpha *= mix(1. - fortEnergy, 1., transitionWave);
	alpha *= 1. - smoothstep(.3, .45, length(vUv - .5)) * fortEnergy * smoothstep(.6, 0.2, uTransition);

	alpha *= smoothstep(2.5, 2.3, uChapter);
	outgoingLight *= alpha;
	
	

	
	gl_FragColor = vec4(outgoingLight, clamp(alpha, 0., 1.));

	#ifdef TONE_MAPPING
	gl_FragColor.rgb = toneMapping(gl_FragColor.rgb);
	#endif

	gl_FragColor = linearToOutputTexel(gl_FragColor);

	#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
	#endif

	#ifdef DITHERING
	gl_FragColor.rgb = dithering(gl_FragColor.rgb);
	#endif

	#define SIXTY_END_AREA

	#define DEBUG_NONE 0
#define DEBUG_UV 1
#define DEBUG_UV1 2
#define DEBUG_UV2 3
#define DEBUG_UV3 4
#define DEBUG_NORMAL_TEXTURE 5
#define DEBUG_NORMAL_SHADING 6
#define DEBUG_NORMAL_GEOMETRY 7
#define DEBUG_TANGENT 8
#define DEBUG_BITANGENT 9
#define DEBUG_ALPHA 10
#define DEBUG_OCCLUSION 11
#define DEBUG_EMISSIVE 12
#define DEBUG_METALLIC 13
#define DEBUG_ROUGHNESS 14
#define DEBUG_BASE_COLOR 15
#define DEBUG_RADIANCE 16
#define DEBUG_IBL_IRRADIANCE 17

#ifdef DEBUG
    #if DEBUG && DEBUG != DEBUG_NONE
        gl_FragColor.a = 1.;
    #endif

    #if DEBUG == DEBUG_UV && defined(USE_UV)
        gl_FragColor.rgb = vec3(vUv, 0);
    #endif

    #if DEBUG == DEBUG_UV1 && defined(USE_UV1)
        gl_FragColor.rgb = vec3(vUv1, 0);
    #endif

    #if DEBUG == DEBUG_UV2 && defined(USE_UV2)
        gl_FragColor.rgb = vec3(vUv2, 0);
    #endif

    #if DEBUG == DEBUG_UV3 && defined(USE_UV3)

        gl_FragColor.rgb = vec3(vUv3, 0);
    #endif

    #if DEBUG == DEBUG_NORMAL_TEXTURE && defined(SIXTY_NORMAL_MAP)
        gl_FragColor.rgb = vec3(nTex + 1.) * .5;
    #endif

    #if DEBUG == DEBUG_NORMAL_SHADING
        gl_FragColor.rgb = vec3(normal + 1.) * .5;
    #endif

    #if DEBUG == DEBUG_NORMAL_GEOMETRY
        gl_FragColor.rgb = vec3(geometryNormal + 1.) * .5;
    #endif

    #if DEBUG == DEBUG_TANGENT && defined(SIXTY_NORMAL_MAP)
        gl_FragColor.rgb = (tbn[0] + 1.) * .5;
    #endif

    #if DEBUG == DEBUG_BITANGENT && defined(SIXTY_NORMAL_MAP)
        gl_FragColor.rgb = (tbn[1] + 1.) * .5;
    #endif

    #if DEBUG == DEBUG_ALPHA
        gl_FragColor.rgb = vec3(diffuseColor.a);
    #endif

    #if DEBUG == DEBUG_OCCLUSION && defined(SIXTY_AO_MAP)
        gl_FragColor.rgb = vec3(occlusion);
    #endif

    #if DEBUG == DEBUG_EMISSIVE
        gl_FragColor = linearToOutputTexel(vec4(totalEmissiveRadiance, 1.));
    #endif

    #if DEBUG == DEBUG_METALLIC
        gl_FragColor.rgb = vec3(metallic);
    #endif

    #if DEBUG == DEBUG_ROUGHNESS
        gl_FragColor.rgb = vec3(roughness);
    #endif

    #if DEBUG == DEBUG_BASE_COLOR
        gl_FragColor.rgb = diffuseColor.rgb;
    #endif

    #if DEBUG == DEBUG_RADIANCE
        gl_FragColor.rgb = radiance;
    #endif

    #if DEBUG == DEBUG_IBL_IRRADIANCE
        gl_FragColor.rgb = iblIrradiance;
    #endif
#endif
}`;

export const vertexShader = /* glsl */ `#ifdef USE_UV
	varying vec2 vUv;
#endif

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec3 vPosition;

uniform mat3 uMapTransform;
varying vec2 vMapUv;

uniform mat3 uMap2Transform;
varying vec2 vMap2Uv;

uniform mat3 uArmMapTransform;
varying vec2 vArmMapUv;

#ifdef SIXTY_AOMAP
	uniform mat3 uAoMapTransform;
	varying vec2 vAoMapUv;
#endif

#ifdef SIXTY_EMISSIVEMAP
	uniform mat3 uEmissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif

uniform mat3 uNormalMapTransform;
varying vec2 vNormalMapUv;

#define SIXTY_UNIFORMS_AREA

void main() {
	#define SIXTY_START_AREA

	#ifdef USE_UV
		vUv = uv;
	#endif

	vMapUv = (uMapTransform * vec3(SIXTY_MAP_UV, 1.)).xy;

	
    #ifdef SIXTY_MAP2
		vMap2Uv = (uMap2Transform * vec3(SIXTY_MAP2_UV, 1.)).xy;
	#endif

	#ifdef SIXTY_ARMMAP
		vArmMapUv = (uArmMapTransform * vec3(SIXTY_ARMMAP_UV, 1.)).xy;
	#endif

	#ifdef SIXTY_AOMAP
		vAoMapUv = (uAoMapTransform * vec3(SIXTY_AOMAP_UV, 1.)).xy;
	#endif

	#ifdef SIXTY_EMISSIVEMAP
		vEmissiveMapUv = (uEmissiveMapTransform * vec3(SIXTY_EMISSIVEMAP_UV, 1.)).xy;
	#endif

	
	vNormalMapUv = (uNormalMapTransform * vec3(SIXTY_NORMALMAP_UV, 1.)).xy;

	vec3 objectNormal = normal;
	vec3 transformedNormal = objectNormal;

	#ifdef USE_INSTANCING
		mat3 im = mat3(instanceMatrix);
		transformedNormal /= vec3(dot(im[0],im[0]), dot(im[1],im[1]), dot(im[2],im[2]));
		transformedNormal = im * transformedNormal;
	#endif
	
	transformedNormal = normalMatrix * transformedNormal;

	vNormal = normalize(transformedNormal);

	vec3 transformed = position; 
	#define SIXTY_TRANSFORMED_AREA
    vPosition = transformed;

	vec4 mvPosition = vec4(transformed, 1.);
	
	#ifdef USE_INSTANCING
		#define SIXTY_INSTANCING_START_AREA
		
		mvPosition = instanceMatrix * mvPosition;
	#endif

	mvPosition = modelMatrix * mvPosition;

	vWorldPosition = mvPosition.xyz;

	mvPosition = viewMatrix * mvPosition;
    vViewPosition = -mvPosition.xyz;

	gl_Position = projectionMatrix * mvPosition;

	#define SIXTY_END_AREA

	#define DEBUG_NONE 0
#define DEBUG_UV 1
#define DEBUG_UV1 2
#define DEBUG_UV2 3
#define DEBUG_UV3 4
#define DEBUG_NORMAL_TEXTURE 5
#define DEBUG_NORMAL_SHADING 6
#define DEBUG_NORMAL_GEOMETRY 7
#define DEBUG_TANGENT 8
#define DEBUG_BITANGENT 9
#define DEBUG_ALPHA 10
#define DEBUG_OCCLUSION 11
#define DEBUG_EMISSIVE 12
#define DEBUG_METALLIC 13
#define DEBUG_ROUGHNESS 14
#define DEBUG_BASE_COLOR 15
#define DEBUG_RADIANCE 16
#define DEBUG_IBL_IRRADIANCE 17

#ifdef DEBUG
    #if DEBUG == DEBUG_UV1 && defined(USE_UV1)
        vUv1 = uv1;
    #endif

    #if DEBUG == DEBUG_UV2 && defined(USE_UV2)
        vUv2 = uv2;
    #endif

    #if DEBUG == DEBUG_UV3 && defined(USE_UV3)
        vUv3 = uv3;
    #endif
#endif
}`;
