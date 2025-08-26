#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/sdf.glsl"

uniform vec2 u_resolution;
// uniform float u_time;
uniform sampler2D maskTexture;
uniform vec3 color;

out vec4 fragColor;

void main() {
	vec2 uv = getUV(u_resolution);
	vec4 mask = texture(maskTexture, uv);
	fragColor = vec4(color, mask.x);
}
