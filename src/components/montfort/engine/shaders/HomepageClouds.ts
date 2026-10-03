/* HomepageClouds material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

varying vec2 vUv;

void main() {
	vUv = uv;
	
	vec4 mvPosition =  projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	gl_Position = mvPosition;
	
}`;

export const fragmentShader = /* glsl */ `precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;
uniform sampler2D tNoise, tPerlin, tMouse;
uniform float uPage, uChapter, uTime;

vec2 rotateUV(vec2 uv, vec2 mid, float rotation)
{
    return vec2(
        cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
        cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
    );
}

#define PI 3.141592653589793

#include <common>

void main() {

    vec2 sUv = gl_FragCoord.xy / uResolution;
    float time = .01 * uTime;

    float amount = smoothstep(.1, 0.5, length(sUv - .5));
    float thickTransition = smoothstep(2.6, 2.9, uChapter - .2 * sUv.y);
    float globeTransition = smoothstep(3., 3.5, uChapter - .02 * sUv.y);
    float dezoom = smoothstep(2.5, 3.5, uChapter);

    vec2 uv = (vUv - vec2(.5, 1.5)) * (1. + dezoom) + vec2(.5, -1.);
    float perlin = texture2D(tPerlin, vec2(3.5, 2.) * uv + vec2(- .2 * time)).r;
    float noise = texture2D(tNoise, vec2(2., 1.) * uv + vec2(-time)).r;

    vec4 mouseSample = texture2D(tMouse, sUv + .1 * (noise - .5) + .05 * (perlin - .5));
    float mouse = clamp(mouseSample.r * .8 + mouseSample.g * .2, 0., 1.);

    uv = (uv - .5) * (1. + .01 * mouse) + .5;
    vec2 dUv = rotateUV(uv, vec2(.5), .3);
    dUv += .02 * perlin;
    dUv += .1 * noise;
    float bigNoise = texture2D(tNoise, .5 * dUv + vec2(.2 * time, 0.1 * time)).r;

    float clouds = smoothstep(.5 - .1 * amount, 1., bigNoise - .2 * globeTransition);

    vec2 rUv = rotateUV(vec2(0.2, .7) * uv - vec2(0., .3 * time), vec2(.5), -.04);
    rUv += bigNoise * .04;
    float sparse = texture2D(tNoise, rUv).r;
    sparse *= 1. + .1 * noise;
    clouds += .6 * smoothstep(.55, .8, sparse) * (1. - thickTransition);

    float fluff = texture2D(tNoise, vec2(1.2, .6) * uv + .02 * perlin + .04 * noise + vec2(time * .3)).r;
    clouds += .5 * smoothstep(mix(.5 - .2 * amount, .78, globeTransition), .8, fluff); 
	
	float count = 4.;

    vec2 fUv = uv;
	vec2 cUv = vec2(fUv.x, fUv.y * (count)) + .01 * mouse;
	float offset = 1.5 * (smoothstep(0.7 + .2 * texture2D(tNoise, fUv * 4.).r, 1., fract(cUv.y)) + floor(cUv.y));

	float cloudShape = (-.01 * abs(sin(fUv.x * 50. + offset)) - 0.03 * abs(sin(fUv.x * 15. + offset)) - 0.02 * abs(sin(fUv.x * 17. + offset))) * count;
	cUv.y += cloudShape;

	cUv += 2. * (texture2D(tNoise, fUv * .2).rg - .5) ;
	cUv *= 1. + .2 * (bigNoise - .5) ;
	cUv.y += .2 * (perlin - .5) ;
	cUv.y -= .05 * count * texture2D(tNoise, fUv * 4.).r;

	float cloudRows = fract(cUv.y);
	cloudRows += smoothstep(0.5, 0., cloudRows);
	
    cloudRows *= thickTransition;

	clouds = mix( clouds, cloudRows, cloudRows);

    float opening = smoothstep(0.2, 1., .9 * length(sUv - .5) + .3 * smoothstep(-.1, .1, (texture2D(tNoise, .2 * uv + .01 * noise+  .005 * perlin).g - .5)) + smoothstep(3.5, 2.8, uChapter));
    opening *= smoothstep(3.5, 3.4, uChapter);
    clouds *= opening;

    
	vec3 color = mix(vec3(0.737,0.773,0.8), vec3(0.961,0.969,0.976), clamp(clouds, 0., 1.));
    color *= vec3(.8, .85, .87);

    /* Godrays */
    vec2 godUv = rotateUV(vUv, vec2(.5), 0.1 + .1 * uChapter);
	float godrays = texture2D(tNoise, vec2(4., 0.01) * godUv + vec2(-.005 * uTime, 0.)).r;
    godrays *= smoothstep(.61 - .05 * (godUv.y - 1.), 1., godrays);
	godrays *= smoothstep(.4, .5, texture2D(tNoise, vec2(4., 0.01) * godUv + vec2(.005 * uTime, 0.)).r);

	godrays *= smoothstep(0., .5, sUv.y) * smoothstep(0., .6, sUv.x)  * smoothstep(1., .7, sUv.x);

	float alpha = min(1., clouds + thickTransition) * opening;

    godrays *= smoothstep(2.4, 2.7, uChapter);
    godrays *= smoothstep(3., 2.9, uChapter);
    color = mix(color, vec3(.95, 1., .9) , smoothstep(.1, 0., alpha));
    alpha += 2. * godrays * (1. - alpha);
    

    
	gl_FragColor = vec4(color, alpha);

}`;
