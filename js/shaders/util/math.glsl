#if !defined(MATH)
#define MATH 1

#include "common.glsl"

mat2 rot2D(float a) {
	float c = cos(a);
	float s = sin(a);
	return mat2(c, s, -s, c);
}

#endif
