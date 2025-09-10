export type Vec2 = [number, number];

export interface Uniforms {
	pos?: Vec2;
	sweep?: Vec2;
}

export type ShapeId = (typeof SHAPE)[keyof typeof SHAPE];
export interface Shape {
	id: number;
	shape: ShapeId;
	size: Vec2;
	sweep?: Vec2;
	pos: Vec2;
	trans?: boolean;
}

export const SHAPE = {
	ELLIPSE: 0,
	BOX: 1,
} as const;

export const hashShape = (shape: Shape) => {
	return shape.id;
};
