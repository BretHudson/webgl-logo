#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/sdf.glsl"

uniform vec2 u_resolution;
uniform int shape;
uniform vec2 size;

out vec4 fragColor;

void main() {
	vec2 uv = getSignedUV(u_resolution);

	vec3 color = vec3(0);

	vec3 sdf = vec3(0);
	switch (shape) {
		case 0:
			sdf = sdgCircle(uv, size.x);
			break;
		case 1:
			sdf.x = sdBox(uv, size);
			break;
	}
	float d = sdf.x;
	d = smoothstep(.01, .0, d);
	color += d;

	fragColor = vec4(color, 1.0);
}
