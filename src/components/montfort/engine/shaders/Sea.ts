/* Sea material shaders, verbatim from the original site (three.js r169 GLSL). */

export const fragmentShader = /* glsl */ `precision highp float;

varying vec2 vUv, vRealUv;
varying vec4 vReflectUv;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

uniform float uTime, uTransition, uChapter;
uniform vec2 uResolution;
uniform vec3 uLightColor, uTransitionColor, uWaterColor;
uniform sampler2D tDiffuse, tNoiseNormal, tMap, tPerlin, tNoise, tMouse;

#define PI 3.1415926536
#define PI2 6.28318530718

vec2 dHdxy_fwd(sampler2D textureSampler, float scale, vec2 uv) {
  vec2 dSTdx = dFdx(vUv);
  vec2 dSTdy = dFdy(vUv);

  float Hll = scale * texture2D(textureSampler, uv).r;
  float dBx = scale * texture2D(textureSampler, uv + dSTdx).r - Hll;
  float dBy = scale * texture2D(textureSampler, uv + dSTdy).r - Hll;

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

vec3 adjustSaturation(vec3 color, float saturation) {
  return mix(vec3(dot(color, vec3(0.2125, 0.7154, 0.0721))), color, saturation);
}

vec3 color = vec3(.5);

float speed = 1.;
float large_waveheight = 2.; 
float small_waveheight = 1.; 

float water(vec2 pos, vec2 diff) {
  float height = 0.;
  float time = 1. * uTime * speed;

  float wave;
  wave += sin(.15 * pos.x + diff.x + time) * large_waveheight;
  wave += sin(.04 * pos.y + diff.y - .1 * pos.x + diff.x + .6 * time) * large_waveheight;
  wave += sin(.1 * pos.x + diff.x - 0.2 * pos.y + diff.y - time) * 1.2 * large_waveheight;
  wave += sin(-.2 * pos.x + diff.x + .05 * pos.y + diff.y + time) * .9 * large_waveheight;

  
  

  wave += sin(1.3 * pos.x + diff.x - 2.4 * (pos.y + diff.y) + 1.2 * wave - 5. * time) * .1 * small_waveheight;
  wave += sin(1.1 * pos.x + diff.x - 1.8 * pos.y + diff.y - .9 * wave - 3. * time) * .025 * small_waveheight;

  height += wave;

  return height;
}
vec3 hueShift(vec3 color, float hue) {
  vec3 k = vec3(0.57735, 0.57735, 0.57735);
  float cosAngle = cos(hue);
  return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

#ifndef saturate
	#define saturate(a) clamp(a, 0.0, 1.0)
#endif

void main() {

  vec2 sUv = gl_FragCoord.xy / uResolution;
  float mouse = clamp(texture2D(tMouse, sUv + .12 * (texture2D(tNoise, vUv).rg - .5)).r, 0., 1.);

  vec3 color = uWaterColor;

  vec2 pos = vWorldPosition.xz;
  pos += mouse * 1.;

   
  
  
  float height = water(pos, vec2(0.));

  
  
  vec3 normal = vec3(0., 1., 0.); 

  vec2 uvCenter = vec2(.16, .05);
  vec2 dUv = (vUv - uvCenter) * (1.1 + .8 * uChapter) + uvCenter;
  float noise = 1.4 * (texture2D(tNoise, dUv * vec2(20., 10.) + .001 * uTime).r - .5);
 
  mat3 tbn = getTangentFrame(-(vViewPosition + vec3(0., height, 0.)), normal, vUv);

  vec3 nTex = (1. -texture2D(tNoiseNormal, 5. * dUv + .02 * normal.rg - uTime * .02).rgb) * 2. - 1.;
  nTex.xy *= -0.5;
  nTex += vec3(0.3) * ((1. - texture2D(tNoiseNormal, 8. * dUv + .05 * mouse + .04 * normal.rg + uTime * .01).rgb) * 2. - 1.);
  normal = normalize(tbn * nTex);

  vec3 nTex2 = (1. - texture2D(tNoiseNormal, 42. * dUv  + 0.1 * noise + .2 * normal.rg - uTime * .05).rgb) * 2. - 1.;
  mat3 tbn2 = getTangentFrame(-vViewPosition, normal, vUv);
  nTex2 += (1. - texture2D(tNoiseNormal, 28. * dUv +  0.05 * noise + .05 * mouse + .04 * normal.rg + uTime * .035).rgb) * 2. - 1.;
  nTex2.xy *= -.5;
  normal = normalize(tbn2 * nTex2);

  vec3 nTex3 = (texture2D(tNoiseNormal, 147. * dUv  + .2 * normal.rg - uTime * .25).rgb * 2. - 1.);
  mat3 tbn3 = getTangentFrame(-vViewPosition, normal, vUv);
  nTex3 += (texture2D(tNoiseNormal, 99. * dUv + .05 * mouse + .04 * normal.rg + uTime * .015).rgb * 2. - 1.);
  nTex3.xy *= .1;
  normal = normalize(tbn3 * nTex3);

  normal.y *= 1. - .5 * mouse;

  normal = normalize(normal);

  vec3 reflexion = texture2DProj(tDiffuse, vReflectUv + .8 * vec4(normal + .2 * mouse, 1.)).rgb;

  reflexion = linearToOutputTexel(vec4(reflexion, 1.)).rgb;
  reflexion += .5 * smoothstep(.5, 1., length(reflexion)) * smoothstep(1., .7, length(reflexion));
  reflexion -= .2 * smoothstep(0.9, 0., length(reflexion)); /* Darken reflexion to make it more obvious */

  vec3 lightPos = vec3(200., 20., 100.);

  vec3 lightDir = normalize(lightPos - vWorldPosition);
  vec3 viewDir = normalize(-vViewPosition);
  vec3 halfwayDir = normalize(lightDir + viewDir);
  float trans = pow(max(dot(-normal, halfwayDir), 0.0), 0.5 + uChapter);
  float spec = pow(max(dot(normal, halfwayDir), 0.), 0.8 + uChapter);

  color *= 1. - .5 * uChapter;
  color *= .8 + .4 * smoothstep(-20., 20., height);

  color -= .1 * trans;
  color *= 1. - .5 * trans;
  
  reflexion *= mix(vec3(1.), vec3(0.2, .95 - .2 * uChapter, 1.), .5 * smoothstep(0.8, 0., spec) * smoothstep(.5, 0., abs(sUv.x - .5))); /* Tint reflexion */
  color = mix(color * (.8 + .2 * reflexion), reflexion, 0.2 * spec + .08); 

  float waver = texture2D(tMap, vec2(vUv.x, 1. - vUv.y) + 0.04 * (length(normal.rb) - .06)).r;
  float waveFoam = .8 * (sin(waver * 10. + 2. * sin(.7 * uTime)) + 1.) * smoothstep(0., 0.1, waver);

  float waveFoamer = length(vUv + .5 * normal.xz - .5);
  waveFoam += .8 * smoothstep(.6, .2, waveFoamer);
  color += .35 * waveFoam;
  color += .5 * waver;

  float foamer = smoothstep(.35, 0.25, length(vUv - vec2(.5, .6) + .03 * normal.rg + .2 * (texture2D(tNoise, vUv * 2. - .01 * uTime).r )));
  color = mix(color, vec3(1.), (.5) * foamer);

  color = adjustSaturation(color, (1.2 - .0 * spec));
  color = hueShift(color, -.3 * smoothstep(0.45, .0, .001 * (vWorldPosition.z - vWorldPosition.x)));

  color = mix(uLightColor, color, smoothstep(.3, 0., uTransition - length(vUv - .5)));
  float alpha = smoothstep(.6, 0.1, uTransition - length(vUv - .5)) * smoothstep(1.7, 1.3, uChapter);

  
  alpha *= smoothstep(0., .1, vRealUv.x) * smoothstep(1., .9, vRealUv.x);
  alpha *= smoothstep(0., .1, vRealUv.y) * smoothstep(1., .9, vRealUv.y);
  vec4 finalColor = vec4(color, alpha);

  float depth = computeDepth(gl_FragCoord.z, 0.1, 30.);
  depth = smoothstep(0.01, 0.7, depth);
  finalColor.rgb = mix(finalColor.rgb, uLightColor, depth);
  
  

  gl_FragColor = finalColor;
}`;

export const vertexShader = /* glsl */ `uniform mat4 textureMatrix;

varying vec2 vUv, vRealUv;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec4 vReflectUv;

void main() {
    vUv = (uv - .5) * 1.5 + .5;
    vRealUv = uv;

    vec4 mvPosition = modelMatrix * vec4(position, 1.);
    vWorldPosition = mvPosition.xyz;
    mvPosition = viewMatrix * mvPosition;
    vViewPosition = -mvPosition.xyz;

    vReflectUv = textureMatrix * vec4( position, 1.0 );

	  gl_Position = projectionMatrix * mvPosition;
}`;
