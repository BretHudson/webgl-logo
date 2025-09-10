#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/sdf.glsl"

uniform vec4 u_color;

out vec4 fragColor;

void main() {
	fragColor = u_color;
}
