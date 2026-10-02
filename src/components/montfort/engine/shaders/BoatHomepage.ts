/* BoatHomepage material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `precision highp float;

uniform float uMobile;
varying vec2 vUv;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0, oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0, oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0, 0.0, 0.0, 0.0, 1.0);
}

void main() {
    vUv = uv;
    vec3 transformed = position;

    if(uMobile == 1.) {
        mat4 rotMat = rotationMatrix(vec3(0., 1., 0.), 0.3);
        transformed = (rotMat * vec4(transformed, 1.)).xyz;
        transformed.x -= 2.7;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tMap, tNoise;
uniform float uTime, uChapter;

varying vec2 vUv;

void main() {

	vec4 map = texture2D(tMap, vUv);

	float smallNoise = texture2D(tNoise, vUv * 7. + vec2(- .12, .03) * uTime).r - .5;
	float antiNoise = texture2D(tNoise, vUv * 10. + vec2( .08, -.08) * uTime).r - .5;
	
	float water = smoothstep(1., .9, map.a);
	float down = smoothstep(.7, .75, vUv.y + .32 * vUv.x);
	water *= down;
	vec2 uv = vUv + .02 * (smallNoise + 0.2 * antiNoise) * water;
	map = texture2D(tMap, uv);

	/* Color Correction */
	map.rgb = mix(map.rgb, vec3(.8), .02);
	
	vec2 dUv = vUv + .3 * (texture2D(tNoise, .5 * vec2(2. , 1.) * vUv + vec2(-0.02, .01) * uTime).rg - .5);
	dUv += .05* smallNoise;
	dUv += .08 * (texture2D(tNoise, 2. * dUv + .01 * uTime).r - .5);
	float smoke = smoothstep(.15, 0., length(dUv - vec2(.68, .18)));
	smoke *= .4+ .6 * smoothstep(.15, 0., length(dUv - vec2(.6, .18)));

	map.rgb += smoothstep(0., .1, smoke) * smoothstep(.2, 0., map.a);
	map.a += .4 * smoke;

	map.rgb = mix(map.rgb, vec3(0.31,0.373,0.427), smoothstep(2.9, 3.2, uChapter));
	map.a *= smoothstep(3.3, 3., uChapter);

	if(map.a < .01) discard ;

	gl_FragColor = map;
	gl_FragColor = linearToOutputTexel(gl_FragColor);
}`;
