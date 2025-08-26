#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/sdf.glsl"

uniform vec2 u_resolution;
uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
	vec2 uv = getUV(u_resolution);
	fragColor = texture(u_texture, uv);
}
