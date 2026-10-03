/* Flares material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

varying vec2 vUv;

void main() {
	vUv = uv;
	
	gl_Position = vec4(position.xy, -.1, 1.0);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

varying vec2 vUv;

uniform vec3 uSunProjected;
uniform sampler2D tNoise;
uniform float uPage, uChapter, uTransition, uRatio;

vec3 hueShift(vec3 color, float hue) {
    vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(hue);
    return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

vec2 rotateUV(vec2 uv, vec2 mid, float rotation)
{
    return vec2(
        cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
        cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
    );
}
vec3 adjustSaturation(vec3 color, float saturation) {
	return mix(vec3(dot(color, vec3(0.2125, 0.7154, 0.0721))), color, saturation);
}

#include <common>

void main() {

	if (uTransition > .5) discard;
	vec3 color = vec3(1.);

	vec2 fUv = vec2(vUv.x, (vUv.y - 0.5) / uRatio + 0.5);
	fUv += 0.002 * (rand(gl_FragCoord.xy) - .5);
	vec2 sunProjected = (uSunProjected.xy * .5 + .5);
	sunProjected = mix(sunProjected, mix(sunProjected + vec2(-3., -7.6), vec2(.95, .8), .95), smoothstep(.6, 1., uChapter));
	
	float angle = length(sunProjected);
	
	float sun = length(fUv - sunProjected );
	vec3 rainbow = hueShift(vec3(1., 0., 0.), 28. * sun * 2.);
	rainbow = adjustSaturation(rainbow, 0.25);
	float sunLight = smoothstep(0.5, 0., sun);	

	vec2 rUv = rotateUV(fUv, sunProjected, 2. * angle);
	float sunAtan = atan(rUv.x - sunProjected.x, rUv.y - sunProjected.y);
	float flares = sin(sunAtan * 14.);
	flares = smoothstep(0.85, 2., flares);
	flares *= smoothstep(0.1, 0.15, sun) ;
	flares *= smoothstep(0.3, 0.15, sun) ;

	float squareFlare = smoothstep(.8, .9, sun) * smoothstep(1., .9, sun);
	squareFlare *= smoothstep(0.8, 1., sin(sunAtan * 3.));

	squareFlare += 0.1 * angle * smoothstep(.75, .78, sun) * smoothstep(.8, .79, sun) * smoothstep(0.9, 1., sin(sunAtan * 2. + .2));
	
	float offsetSun = length(fUv - sunProjected - vec2(-0.2, 0.) );
	float ghostFlare = smoothstep(0.3, 0.33, offsetSun) * smoothstep(0.5, 0.4, offsetSun);
	ghostFlare *= smoothstep(0.4 + angle * .1, 1., sin(sunAtan * 2. + 1.6));

	color = mix(color, rainbow, 0.1 * smoothstep(0., 0.05, flares) + 0.5 * squareFlare);
	float alpha = 0.3 * sunLight + 0.7 * flares + 0.2 * squareFlare;
	alpha += .08 * ghostFlare;

	
	
	alpha *= smoothstep(.7, .5, uChapter) + 0.4 * smoothstep(1., 1.6, uChapter);
	alpha *= smoothstep(0.4, 0.0, uTransition);
	
	
	gl_FragColor = vec4(color, alpha);
	

}`;
