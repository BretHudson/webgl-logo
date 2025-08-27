#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/math.glsl"
#include "util/sdf.glsl"

uniform vec2 u_resolution;
uniform float u_time;
uniform int shape;
uniform vec2 pos;
uniform vec2 size;
uniform vec2 sweep;

out vec4 fragColor;

vec2 closestPointOnSegment(vec2 p, vec2 a, vec2 b) {
	vec2 ba = b - a;
	vec2 pa = p - a;
	float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
	return a + t * ba;
}

void main() {
	vec2 uv = getSignedUV(u_resolution);

	vec3 sdf = vec3(9999.);
	vec2 ss = normalize(sweep);
	float n = length(sweep);
	vec2 p1 = uv - pos;

	for (float t = 0.; t <= n; t += .0025) {
		vec2 p = p1 - ss * t;
		switch (shape) {
			case 0:
				sdf = min(sdf, sdgEllipse(p, size));
				break;
			case 1:
				sdf.x = min(sdf.x, sdBox(p, size));
				break;
		}
	}

	sdf.x = smoothstep(.01, .0, sdf.x);

	fragColor = vec4(sdf, 1.0);
}
