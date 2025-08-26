#if !defined(SDF)
#define SDF 1

#include "common.glsl"

float sdCircle(vec2 p, float r) {
	return length(p) - r;
}

vec3 sdgCircle(in vec2 p, in float r) {
	float d = length(p);
	return vec3(d - r, p / d);
}

float sdBox(in vec2 p, in vec2 b) {
	vec2 d = abs(p) - b;
	return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float udSegment(in vec2 p, in vec2 a, in vec2 b) {
	vec2 ba = b - a;
	vec2 pa = p - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
	return length(pa - h * ba);
}

vec2 sdSweep(vec2 p, vec2 a, vec2 b) {
	vec2 ba = b - a;
	vec2 pa = p - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
	vec2 proj = a;
	return p - proj + h * ba;
}

#endif
