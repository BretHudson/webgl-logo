#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/sdf.glsl"

uniform vec2 u_resolution;

out vec4 fragColor;

void main() {
	fragColor = vec4(vec3(.5, .1, .0), 1.);
}
