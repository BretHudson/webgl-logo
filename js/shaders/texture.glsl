#version 300 es

precision mediump float;

#include "util/common.glsl"
#include "util/math.glsl"

uniform vec2 u_resolution;
uniform sampler2D u_texture;
uniform vec2 pos;
uniform vec2 origin;
uniform float rot;

out vec4 fragColor;

void main() {
	vec2 uv = getUV(u_resolution);
	vec4 p = vec4(uv, 0., 1.);
	float ratio = u_resolution.x / u_resolution.y;
	p *= mat4Translate(-origin) * mat4Scale(1., ratio);
	p *= modelViewMatrix(-pos, -rot / 180. * PI);
	p *= mat4Scale(1., 1. / ratio) * mat4Translate(origin);
	fragColor = texture(u_texture, p.xy);
}
