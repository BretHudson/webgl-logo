#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/math.glsl"
#include "util/sdf.glsl"

uniform vec2 u_resolution;
uniform int shape;
uniform vec2 pos;
uniform vec2 origin;
uniform float rot;
uniform vec2 size;

out vec4 fragColor;

void main() {
	vec2 uv = getSignedUV(u_resolution);

	vec3 sdf = vec3(0);
	vec4 p = vec4(uv - pos, 0., 1.);
	p *= modelViewMatrix(vec2(0), -rot / 180. * PI);
	switch (shape) {
		case 1:
			sdf = sdgEllipse(p.xy, size);
			break;
		case 2:
			sdf.x = sdBox(p.xy, size);
			break;
	}

	float d = sdf.x;
	d = smoothstep(.0, -.001, d);

	fragColor = vec4(vec3(d), 1.0);
}
