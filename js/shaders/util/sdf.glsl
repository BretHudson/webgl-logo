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

vec3 sdgEllipse(vec2 p, in vec2 ab) {
	vec2 sp = sign(p);
	p = abs(p);

	bool s = dot(p / ab, p / ab) > 1.0;
	float w = atan(p.y * ab.x, p.x * ab.y);
	if (!s)
		w = (ab.x * (p.x - ab.x) < ab.y * (p.y - ab.y)) ? 1.570796327 : 0.0;

	for (int i = 0; i < 4; i++) {
		vec2 cs = vec2(cos(w), sin(w));
		vec2 u = ab * vec2(cs.x, cs.y);
		vec2 v = ab * vec2(-cs.y, cs.x);
		w = w + dot(p - u, v) / (dot(p - u, u) + dot(v, v));
	}
	vec2 q = ab * vec2(cos(w), sin(w));

	float d = length(p - q);
	return vec3(d, sp * (p - q) / d) * (s ? 1.0 : -1.0);
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
	// float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
	return pa - h * ba;
}

#endif
