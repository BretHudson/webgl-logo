#if !defined(MATH)
#define MATH 1

#include "common.glsl"

mat2 rot2D(float a) {
	float c = cos(a);
	float s = sin(a);
	return mat2(c, s, -s, c);
}

mat4 mat4Identity = mat4(1.);

mat4 mat4Translate(vec3 v) {
	mat4 matrix = mat4Identity;
	matrix[0][3] = v.x;
	matrix[1][3] = v.y;
	matrix[2][3] = v.z;
	return matrix;
}

mat4 mat4Translate(float x, float y) {
	return mat4Translate(vec3(x, y, 0.));
}

mat4 mat4Translate(vec2 t) {
	return mat4Translate(vec3(t, 0.));
}
mat4 mat4Translate(float x, float y, float z) {
	return mat4Translate(vec3(x, y, z));
}

mat4 mat4Rotate2D(float a) {
	mat4 matrix = mat4Identity;
	float c = cos(a);
	float s = sin(a);
	matrix[0][0] = c;
	matrix[0][1] = s;
	matrix[1][0] = -s;
	matrix[1][1] = c;
	return matrix;
}

mat4 mat4Scale(vec3 s) {
	mat4 matrix = mat4Identity;
	matrix[0][0] = 1. / s.x;
	matrix[1][1] = 1. / s.y;
	matrix[2][2] = 1. / s.z;
	return matrix;
}

mat4 mat4Scale(float x, float y) {
	return mat4Scale(vec3(x, y, 1.));
}

mat4 modelViewMatrix(vec3 pos, float angle, vec3 scale) {
	return mat4Rotate2D(angle) * mat4Translate(pos);
}

mat4 modelViewMatrix(vec2 pos, float angle) {
	return modelViewMatrix(vec3(pos, 0.), angle, vec3(1.));
}

#endif
