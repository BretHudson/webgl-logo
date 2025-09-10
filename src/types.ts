export type Vec2 = [number, number];

export interface Uniforms {
	pos?: Vec2;
	sweep?: Vec2;
}

export type ShapeId = (typeof SHAPE)[keyof typeof SHAPE];
export interface Shape {
	id: number;
	shape: ShapeId;
	pos: Vec2;
	rot: number;
	size: Vec2;
	sweep?: Vec2;
	trans?: boolean;
}

export const SHAPE = {
	GROUP: 0,
	ELLIPSE: 1,
	BOX: 2,
} as const;

export const hashShape = (shape: Shape) => {
	return shape.id;
};
