/* PBR material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `#ifdef USE_UV
	varying vec2 vUv;
#endif

varying vec3 vNormal;
varying vec3 vViewPosition;

#ifdef SIXTY_MAP
	uniform mat3 uMapTransform;
	varying vec2 vMapUv;
#endif

#ifdef SIXTY_ARMMAP
	uniform mat3 uArmMapTransform;
	varying vec2 vArmMapUv;
#endif

#ifdef SIXTY_AOMAP
	uniform mat3 uAoMapTransform;
	varying vec2 vAoMapUv;
#endif

#ifdef SIXTY_EMISSIVEMAP
	uniform mat3 uEmissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif

#ifdef SIXTY_NORMALMAP
	uniform mat3 uNormalMapTransform;
	varying vec2 vNormalMapUv;
#endif

#define SIXTY_UNIFORMS_AREA

void main() {
	#define SIXTY_START_AREA

	#ifdef USE_UV
		vUv = uv;
	#endif

	#ifdef SIXTY_MAP
		vMapUv = (uMapTransform * vec3(SIXTY_MAP_UV, 1.)).xy;
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

	#ifdef SIXTY_NORMALMAP
		vNormalMapUv = (uNormalMapTransform * vec3(SIXTY_NORMALMAP_UV, 1.)).xy;
	#endif	

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

	vec4 mvPosition = vec4(transformed, 1.);
	
	#ifdef USE_INSTANCING
		#define SIXTY_INSTANCING_START_AREA
		
		mvPosition = instanceMatrix * mvPosition;
	#endif

	mvPosition = modelViewMatrix * mvPosition;

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

export const fragmentShader = /* glsl */ `precision highp float;

uniform vec3 uColor;

#ifdef SIXTY_MAP
	uniform sampler2D tMap;
	varying vec2 vMapUv;
#endif

uniform float uMetalness;
uniform float uRoughness;

#ifdef SIXTY_ARMMAP
	uniform sampler2D tArmMap;
	uniform float uRoughnessMapIntensity;
	uniform float uMetalnessMapIntensity;
	varying vec2 vArmMapUv;
#endif

#ifdef SIXTY_AOMAP
	uniform sampler2D tAoMap;
	varying vec2 vAoMapUv;
#endif

#if defined(SIXTY_ARMMAP) || defined(SIXTY_AOMAP)
	uniform float uAoMapIntensity;
#endif

uniform vec3 uEmissive;

uniform vec3 uAmbient;
uniform float uAmbientIntensity;

#ifdef SIXTY_EMISSIVEMAP
	uniform sampler2D tEmissiveMap;
	varying vec2 vEmissiveMapUv;
#endif

#ifdef SIXTY_NORMALMAP
	uniform sampler2D tNormalMap;
	varying vec2 vNormalMapUv;
	uniform vec2 uNormalScale;

#endif

#ifdef SIXTY_ENVMAP
	uniform sampler2D tEnvMap;
	uniform mat3 uEnvMapRotation;
	uniform float uEnvMapIntensity;
#endif

uniform float uOpacity;
#ifdef USE_ALPHATEST
	uniform float uAlphaTest;
#endif

#ifdef SIXTY_ALPHAMAP
	uniform sampler2D tAlphaMap;
#endif

#ifdef USE_UV
	varying vec2 vUv;
#endif

varying vec3 vNormal;
varying vec3 vViewPosition;

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

void main() {
	#define SIXTY_START_AREA

	vec4 diffuseColor = vec4(uColor, uOpacity);

	#ifdef SIXTY_MAP
		vec4 baseColorMapSample = texture2D(tMap, vMapUv);

		#ifdef SIXTY_ALPHAMAP
			diffuseColor.rgb *= baseColorMapSample.rgb;
			diffuseColor.a *= texture2D(tAlphaMap, vUv).r;
		#else
			diffuseColor *= baseColorMapSample;
		#endif

		#define SIXTY_MAP_AREA
	#endif

	#ifdef USE_ALPHATEST
		if (diffuseColor.a < uAlphaTest) discard;
	#endif

	
	vec4 armSample = vec4(1);

	#ifdef SIXTY_ARMMAP
		#ifdef SIXTY_AOMAP
			armSample.gb *= texture2D(tArmMap, vArmMapUv).gb;
		#else
			armSample.rgb *= texture2D(tArmMap, vArmMapUv).rgb;
		#endif

		armSample.gb *= vec2(uRoughnessMapIntensity, uMetalnessMapIntensity);

		#define SIXTY_ARMMAP_AREA
	#endif

	#ifdef SIXTY_AOMAP
		armSample.r *= texture2D(tAoMap, vAoMapUv).r;
	#endif

	float roughness = clamp(armSample.g * uRoughness, 0.04, 1.0);
	float metallic = clamp(armSample.b * uMetalness, 0.04, 1.0);

	vec3 nonPerturbatedNormal = vNormal;
	
	float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
	vec3 normal = normalize(vNormal);
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif

	#ifdef SIXTY_NORMALMAP
		mat3 tbn = getTangentFrame(-vViewPosition, normal, vNormalMapUv);

		#if defined(DOUBLE_SIDED)
			tbn[0] *= faceDirection;
			tbn[1] *= faceDirection;
		#endif

		vec3 nTex = texture2D(tNormalMap, vNormalMapUv).rgb * 2. - 1.;
		nTex.xy *= uNormalScale;
		normal = normalize(tbn * nTex);

		#define SIXTY_NORMALMAP_AREA
	#endif

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
	vec3 geometryViewDir = isOrthographic ? vec3(0., 0., 1.) : normalize(vViewPosition);

	vec3 ambientLightColor = uAmbient * uAmbientIntensity;
	
    vec3 iblIrradiance = vec3(0.);
	vec3 radiance = vec3(0.);
	vec3 irradiance = getAmbientLightIrradiance(ambientLightColor);

	#ifdef SIXTY_ENVMAP
		iblIrradiance += getIBLIrradiance(geometryNormal, tEnvMap, uEnvMapIntensity, uEnvMapRotation);
		radiance += getIBLRadiance(geometryViewDir, geometryNormal, pbrMaterial.roughness, tEnvMap, uEnvMapIntensity, uEnvMapRotation);

		#define SIXTY_ENVMAP_AREA
	#endif

	
	RE_IndirectDiffuse(irradiance, geometryPosition, geometryNormal, geometryViewDir, pbrMaterial, reflectedLight);
	RE_IndirectSpecular(radiance, iblIrradiance, geometryPosition, geometryNormal, geometryViewDir, pbrMaterial, reflectedLight);

	#if defined(SIXTY_ARM_AS_AO) || defined(SIXTY_AOMAP)
		float occlusion = (armSample.r - 1.) * uAoMapIntensity + 1.;
		reflectedLight.indirectDiffuse *= occlusion;

		#ifdef SIXTY_ENVMAP
			float dotNV = saturate(dot(geometryNormal, geometryViewDir));
			reflectedLight.indirectSpecular *= computeSpecularOcclusion(dotNV, occlusion, pbrMaterial.roughness);
		#endif

		#define SIXTY_AOMAP_AREA
	#endif

	vec3 totalEmissiveRadiance = uEmissive;
	#ifdef SIXTY_EMISSIVEMAP
		totalEmissiveRadiance *= texture2D(tEmissiveMap, vEmissiveMapUv).rgb;

		#define SIXTY_EMISSIVEMAP_AREA
	#endif

	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

	#ifdef OPAQUE
		diffuseColor.a = 1.0;
	#endif

	gl_FragColor = vec4(outgoingLight, diffuseColor.a);

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
