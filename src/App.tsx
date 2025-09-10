import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from './Canvas';
import {
	useRenderer,
	type GLRef,
	type ShapeOrderItem,
} from './hooks/useRenderer';
import { ShapeInput } from './ShapeInput';
import type { Shape, Vec2 } from './types';
import { hashShape, SHAPE } from './types';

// const sweep: Vec2 = [0.15, -0.15];
const sweep: Vec2 = [0.15, -45];
const rectSize: Vec2 = [0.1, 0.3];
function App() {
	const [shapes, setShapes] = useState<Shape[]>([
		{
			id: -2,
			shape: SHAPE.GROUP,
			pos: [0, 0],
			// rot: 0,
			rot: 100,
			size: [0, 0],
			sweep: [0, 0],
		},
		{
			id: -1,
			shape: SHAPE.GROUP,
			pos: [0, 0],
			// rot: 0,
			rot: 100,
			size: [0, 0],
			sweep: [0, 0],
		},
		{
			id: 0,
			shape: SHAPE.ELLIPSE,
			pos: [0.4, 0],
			rot: 180,
			size: [0.2, 0.2],
			sweep: [...sweep],
		},
		{
			id: 1,
			shape: SHAPE.BOX,
			pos: [0, 0],
			rot: 0,
			size: [...rectSize],
			// sweep: [...sweep],
		},
		{
			id: 2,
			shape: SHAPE.BOX,
			pos: [0, 0.75],
			rot: 45,
			size: [0.1, 0.1],
			// sweep: [...sweep],
		},
		{
			id: 3,
			shape: SHAPE.BOX,
			pos: [0.2, 0.4],
			rot: 0,
			size: [0.1, 0.1],
			sweep: [...sweep],
		},
		{
			id: 4,
			shape: SHAPE.BOX,
			pos: [-0.2, -0.4],
			rot: 0,
			size: [0.1, 0.1],
			sweep: [...sweep],
		},
	]);

	const [shapeOrder, setShapeOrder] = useState<ShapeOrderItem[]>([
		{ nodeId: 2 },
		{ nodeId: 4 },
		{ nodeId: 3 },
		{
			nodeId: -2,
			childrenItems: [
				{ nodeId: -1, childrenItems: [{ nodeId: 0 }, { nodeId: 1 }] },
			],
		},
	]);
	const glRef = useRef<GLRef>({
		shapes,
		shapeOrder,
	});

	const updateShape = useCallback(
		(id: number, key: string, value: unknown) => {
			setShapes((shapes) => {
				const i = shapes.findIndex(({ id: _id }) => _id === id);
				const item = shapes[i];
				if (!item) throw new Error('???');
				const newShapes = [...shapes];
				newShapes[i] = {
					...item,
					[key]: value,
				};
				return newShapes;
			});
		},
		[],
	);

	useEffect(() => {
		glRef.current.shapes = shapes;
		glRef.current.shapeOrder = shapeOrder;
	}, [shapes, shapeOrder]);

	useRenderer(glRef);

	const moveShape = useCallback((id: number, dir: -1 | 1) => {
		setShapeOrder((shapeOrder) => {
			const index = shapeOrder.indexOf(id);
			// TODO(bret): handle nested items
			if (index === -1) return shapeOrder;

			const newIndex = index + dir;
			if (newIndex < 0 || newIndex >= shapeOrder.length)
				return shapeOrder;

			const newShapeOrder = [...shapeOrder];
			const item = newShapeOrder.splice(index, 1);
			newShapeOrder.splice(newIndex, 0, ...item);
			return newShapeOrder;
		});
	}, []);

	function mapShapes(item: ShapeOrderItem, i: number) {
		const { nodeId, childrenItems } = item;

		const first = i === 0;
		const last = i === shapeOrder.length - 1;

		const shape = shapes.find(({ id }) => id === nodeId);
		if (!shape) throw new Error('???');

		return (
			<ShapeInput
				key={hashShape(shape)}
				shapeInfo={shape}
				updateShape={updateShape}
				moveShape={moveShape}
				canMoveUp={!first}
				canMoveDown={!last}
			>
				{childrenItems?.map(mapShapes)}
			</ShapeInput>
		);
	}

	return (
		<div className="grid">
			<div className="shape-inputs">{shapeOrder.map(mapShapes)}</div>
			<Canvas />
		</div>
	);
}

export default App;
