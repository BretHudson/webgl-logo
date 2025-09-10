#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/math.glsl"
#include "util/sdf.glsl"

#define MIN_DIST .0001
#define MAX_DIST 10.

uniform vec2 u_resolution;
uniform int shape;
uniform vec2 pos;
uniform float rot;
uniform vec2 size;
uniform vec2 sweep;

out vec4 fragColor;

vec2 closestPointOnSegment(vec2 p, vec2 a, vec2 b) {
	vec2 ba = b - a;
	vec2 pa = p - a;
	float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
	return a + t * ba;
}

vec3 map(vec2 p, vec2 size) {
	vec3 sdf = vec3(999.);
	switch (shape) {
		case 1:
			sdf = sdgEllipse(p, size);
			break;
		case 2:
			sdf.x = sdBox(p, size);
			break;
	}
	return sdf;
}

void main() {
	vec2 uv = getSignedUV(u_resolution);

	vec3 sdf = vec3(1e6);

	vec2 sweepV = vec2(sweep.x, 0) * rot2D(-sweep.y / 180.0 * PI);// * rot2D(u_time * .25);
	float sweepLength = length(sweepV);

	vec2 ro = (uv - pos) - sweepV;
	vec2 rd = normalize(sweepV);

	float t = 0.;
	for (int i = 0; i < 1000; ++i) {
		vec4 p = vec4(ro + rd * t, 0., 1.);
		// p *= rot2D(-rot / 180. * PI);
		p *= modelViewMatrix(vec2(0), -rot / 180. * PI);

		float d = map(p.xy, size).x;
		t += d;
		if (abs(d) < MIN_DIST || t > MAX_DIST)
			break;
	}

	if (t <= sweepLength) {
		vec2 p = ro + rd * t;
		sdf = map(p, size);
	}

	sdf.x = smoothstep(1., .0, sdf.x);
	// sdf.y = t / sweepLength;

	fragColor = vec4(sdf, 1.0);
}
