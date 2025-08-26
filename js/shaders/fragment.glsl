// #version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/sdf.glsl"

uniform vec2 u_resolution;
uniform float u_time;

void main() {
	vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

	vec3 color = vec3(0);

	float d = sdCircle(uv, .5);
	d = smoothstep(.01, .0, d);
	color += d;

	gl_FragColor = vec4(color, 1.0);
}
