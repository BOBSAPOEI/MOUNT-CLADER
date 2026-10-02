/* Holograms material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `uniform float uOffset;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 transformed = position;
  transformed.x += uOffset;
  transformed.z += .5 * uOffset;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(transformed, 1.);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform vec3 uColor, uGlowColor;

uniform float uTime;
uniform float uFade;
uniform float uDpr;
uniform vec2 uResolution;
uniform sampler2D tMap;
uniform sampler2D tNoise;
uniform sampler2D tMouse;

varying vec2 vUv;

void main() {

    vec2 sUv = gl_FragCoord.xy/uResolution;
    float mouse = clamp(texture2D(tMouse, sUv).r, 0., 1.);
    float boats = step(.62, vUv.x);
    vec4 data = texture2D(tMap, vUv);
    
    if(boats < .5){
        vec4 blur = texture2D(tMap, vUv + (1./(uResolution * uDpr)));
        data = (data + blur) * .5;
    }

    float glow = data.g;

    float factory = step(.4, vUv.y) * (1. - boats);
    float t = uTime * .005;
    float noise = texture2D(tNoise, vUv * .2 + vec2(-t * 5., -t)).r;
    noise *= texture2D(tNoise, vUv * .15 + vec2(t, 4. * t)).r;
    noise = smoothstep(0.2, 0.4, noise);
   
    float intensity =  mix(3., 1.8, boats) * data.r;
    float glowIntensity = mix(4. - 1. * factory, 3., boats);
    glowIntensity += (8. + 2. * factory) * noise;
    glowIntensity = clamp(glowIntensity, 0., 6. - 3. * boats);
    glowIntensity += (2. - boats) * mouse;
    intensity += glowIntensity * glow;
    
    

    vec3 color = intensity * mix(uColor, .5 * uGlowColor, smoothstep(1., 2., intensity));

    float alpha = smoothstep(0., .1, length(data.rgb));
    alpha *= 0.85;

    gl_FragColor = vec4(color.rgb, alpha) * smoothstep(0.2, .8, uFade + .4 * data.b);
    
}`;
