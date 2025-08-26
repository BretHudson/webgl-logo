#if !defined(COMMON)
#define COMMON 1

#define PI  3.141592

vec2 getUV(vec2 res) {
	return (gl_FragCoord.xy * 2. - res.xy) / min(res.x, res.y);
}

#endif
