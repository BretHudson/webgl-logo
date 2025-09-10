#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/math.glsl"

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture;
uniform vec2 pos;
uniform vec2 origin;
uniform float rot;

out vec4 fragColor;

void main() {
	vec2 uv = getUV(u_resolution);
	vec2 p = uv - pos - origin;
	p *= rot2D(rot);
	p += origin;
	fragColor = texture(u_texture, p);
}
