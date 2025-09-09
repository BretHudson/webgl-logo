export type Vec2 = [number, number];

export interface Uniforms {
	pos?: Vec2;
	sweep?: Vec2;
}

export interface Shape {
	shape: (typeof SHAPE)[keyof typeof SHAPE];
	size: Vec2;
	sweep?: Vec2;
	pos?: Vec2;
	trans?: boolean;
}

export const SHAPE = {
	ELLIPSE: 0,
	BOX: 1,
} as const;

export const hashShape = (shape: Shape, i: number | string = '') => {
	return [shape.shape, shape.pos, shape.size, i].filter(Boolean).join('-');
};
