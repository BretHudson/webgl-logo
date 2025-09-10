import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from './Canvas';
import { useRenderer, type GLRef } from './hooks/useRenderer';
import { ShapeInput } from './ShapeInput';
import type { Shape, Vec2 } from './types';
import { hashShape, SHAPE } from './types';

// const sweep: Vec2 = [0.15, -0.15];
const sweep: Vec2 = [0.15, -45];
const rectSize: Vec2 = [0.1, 0.3];
function App() {
	const [shapes, setShapes] = useState<Shape[]>([
		{
			id: -1,
			shape: SHAPE.GROUP,
			pos: [-0.5, 0.5],
			rot: 0,
			size: [0.2, 0.4],
			sweep: [...sweep],
		},
		{
			id: 0,
			shape: SHAPE.ELLIPSE,
			pos: [-0.5, 0.5],
			rot: 0,
			size: [0.2, 0.4],
			// sweep: [...sweep],
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

	const [shapeOrder, setShapeOrder] = useState([2, [-1, 0, 1], 3, 4]);
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
	}, [shapes]);
	useEffect(() => {
		glRef.current.shapeOrder = shapeOrder;
	}, [shapeOrder]);

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

	function mapShapes(id: number | number[], i: number) {
		const first = i === 0;
		const last = i === shapeOrder.length - 1;

		const [targetId, childIds] = Array.isArray(id)
			? [id[0], id.slice(1)]
			: [id, undefined];

		const shape = shapes.find(({ id }) => id === targetId);
		if (!shape) throw new Error('???');

		const children = childIds && childIds.map(mapShapes);

		return (
			<ShapeInput
				key={hashShape(shape)}
				shapeInfo={shape}
				updateShape={updateShape}
				moveShape={moveShape}
				canMoveUp={!first}
				canMoveDown={!last}
			>
				{children}
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
