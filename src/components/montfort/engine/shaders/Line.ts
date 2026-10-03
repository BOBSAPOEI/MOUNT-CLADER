/* Line material shaders, verbatim from the original site (three.js r169 GLSL). */

export const vertexShader = /* glsl */ `varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
}`;

export const fragmentShader = /* glsl */ `precision highp float;

uniform float uTime;
uniform float uFade;
uniform vec3 uColor;

varying vec2 vUv;

float createLine(vec2 lineUv, float lineWidth, float amplitude, float offset, float innerSmoothness, float outerSmoothness) {
    float t = uTime;
    float halfLineWidth = lineWidth * .5;

    lineUv.x += sin(lineUv.y * 2. + uTime * .1 + offset * 34.5) * amplitude;
    lineUv.x += sin(lineUv.y + t + cos(lineUv.y * 10. + t * 2. + offset * 123.5) * 2. + +offset * 678.5) * amplitude;
    lineUv.x -= offset;

    float absUvX = abs(lineUv.x - .5);
    float line = smoothstep(halfLineWidth + innerSmoothness, halfLineWidth - innerSmoothness, absUvX) + smoothstep(halfLineWidth + outerSmoothness, halfLineWidth - outerSmoothness, absUvX) * 2.;
    line *= smoothstep(-.9, -.2, sin(lineUv.y * 4. + offset * 10. + .4 * uTime * (1. + 10. * offset)));
    return line;
}

void main() {
    float depth = gl_FragCoord.z / gl_FragCoord.w / 120.;

    float edgeFade = smoothstep(1., .6, abs(vUv.y * 2. - 1.));
    float isLine = step(.5, vUv.x);

    vec2 lineUv = vec2(vUv.x * 2. - 1., vUv.y);
    float lines = createLine(lineUv, .001, .04, .1, .01, .1);
    lines += createLine(lineUv, .002, .01, .2, .03, .1) * .7;
    lines += createLine(lineUv, .0015, .02, -.1, .02, .1) * .8;
    lines *= edgeFade;
    lines *= isLine;

    vec2 glowUv = vec2(vUv.x * 2., vUv.y);
    float glow = createLine(glowUv, .0, .04, .1, .5, 1.) * .1;
    glow += createLine(glowUv, .0, .01, .2, .5, 1.) * .2;
    glow += createLine(glowUv, .0, .02, -.1, .5, 1.) * .3;
    glow *= .65;

    glow *= edgeFade;
    glow *= (1. - isLine);
    glow *= smoothstep(.5, .4, abs(glowUv.x - .5));

    vec3 color = uColor * (glow + lines);
    gl_FragColor = vec4(color, glow + lines) * smoothstep(.6, .0, depth) * uFade;
}`;
