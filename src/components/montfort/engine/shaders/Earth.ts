/* Earth material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

uniform mat4 secondaryProjectionMatrix;
uniform mat4 secondaryViewMatrix;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
	vec4 mvPosition = secondaryViewMatrix * modelMatrix * vec4(position, 1.0);
	gl_Position = secondaryProjectionMatrix * mvPosition;

	vPosition = position;
    vViewPosition = -mvPosition.xyz;

	mat3 normalMat = mat3(inverse(transpose(secondaryViewMatrix * modelMatrix)));
	vNormal = vec3(normalMat * normal);
	vUv = uv;
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform float uTime;
uniform vec2 uResolution;

uniform vec3 uSeaColor, uEarthTint, uRimColor, uCloudsColor, uAmbientColor, uLightColor;

uniform vec3 uSunPosition;
uniform float uEarthShininess, uSeaShininess;
uniform float uEarthSpecular, uSeaSpecular;

uniform float uChapter;

uniform sampler2D tNoise;
uniform sampler2D tMouseComputation;
uniform sampler2D tData;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

vec2 dHdxy_fwd(vec3 baseSample, sampler2D textureSampler, vec2 uv, float strength) {
    vec2 dSTdx = dFdx(vUv);
    vec2 dSTdy = dFdy(vUv);

    float Hll = strength * baseSample.r;
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

vec3 applyTint(vec3 color, vec3 tint, float weight) {
    float luminance = dot(color, vec3(0.3, 0.59, 0.11));
    weight *= 1.0 - smoothstep(0.9, 1., luminance);
    weight *= smoothstep(0.45, .3, abs(.5 - vUv.y)); 

    return mix(color, color * tint, weight);
}

vec3 adjustSaturation(vec3 color, float saturation) {
    return mix(vec3(dot(color, vec3(0.2125, 0.7154, 0.0721))), color, saturation);
}

#define SEA vec3(.118, .231, .459)

void main() {
    vec2 viewportUv = gl_FragCoord.xy / uResolution;
    float mouse = texture2D(tMouseComputation, viewportUv).r;

    
    vec2 uv = vUv;
    uv.y = 1. - uv.y;

    vec3 diffuseColor = texture2D(tData, uv).rgb;

    float poles = smoothstep(0.45, .35, abs(.5 - uv.y));
    float seaMask = smoothstep(.3, .2, length(diffuseColor - SEA));

    vec3 normal = vNormal;
    normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(diffuseColor.rgb, tData, uv, .01));

    
    vec3 lightDir = normalize(uSunPosition - vPosition);
    vec3 N = normalize(normal);
    vec3 V = normalize(vViewPosition);

    
    vec3 ambient = uAmbientColor;
    float diffuse = max(dot(N, lightDir), 0.0);

    
    vec3 halfwayDir = normalize(lightDir + V);
    float shininess = mix(uEarthShininess, uSeaShininess, seaMask) * 16.;
    float specular = pow(max(dot(N, halfwayDir), 0.0), shininess);

    
    float rim = 1.0 - max(dot(V, N), 0.0);
    float fresnel = pow(clamp(1. - dot(N, V), 0., 1.), 5.);
    vec3 rimColor = uRimColor * (fresnel + rim);

    
    float t = uTime * .00035;
    vec2 cloudsUv = vec2(uv.x - t + sin(uv.y * 50. + t * 2.) * .001, uv.y + sin(uv.x * 50. - t * 2.) * .004) * 4.;
    vec2 shadowDecay = -(normal.xz - normalize(uSunPosition.xy)) * .01;
    
    float cloudShadow = texture2D(tData, cloudsUv + shadowDecay, 5.).a * poles;

    float clouds = texture2D(tData, cloudsUv).a * poles * .5;
    vec3 cloudsColor = uCloudsColor;

    
    diffuseColor = mix(diffuseColor, uSeaColor, seaMask);
    diffuseColor = applyTint(diffuseColor, uEarthTint, (1.0 - seaMask));
    diffuseColor = adjustSaturation(diffuseColor, smoothstep(0.44, .2, abs(.5 - uv.y)));
    diffuseColor += (texture2D(tNoise, uv * vec2(2., 1.) * 20.).b - .5) * .1 * (1. - seaMask);
    diffuseColor = mix(diffuseColor, cloudsColor, clouds);
    diffuseColor = mix(diffuseColor, uRimColor, fresnel);
    diffuseColor -= cloudShadow * (1. - clouds) * .25;

    vec3 finalColor = ambient + diffuseColor * (diffuse) + specular * mix(uEarthSpecular * poles, uSeaSpecular, seaMask);

    
    
    finalColor = mix(finalColor, vec3(0.0196, 0.0745, 0.1098), smoothstep(3.99, 4.1, uChapter));

    gl_FragColor = vec4(finalColor, 1.0);
    
}`;
