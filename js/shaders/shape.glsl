#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/sdf.glsl"

uniform vec2 u_resolution;
uniform int shape;
uniform vec2 pos;
uniform vec2 size;

out vec4 fragColor;

void main() {
	vec2 uv = getSignedUV(u_resolution);

	vec3 sdf = vec3(0);
	vec2 p = uv - pos;
	switch (shape) {
		case 0:
			sdf = sdgEllipse(p, size);
			break;
		case 1:
			sdf.x = sdBox(p, size);
			break;
	}

	float d = sdf.x;
	d = smoothstep(.0, -.001, d);

	fragColor = vec4(vec3(d), 1.0);
}
