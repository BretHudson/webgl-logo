import { Vector2Input } from './components/Vector2Input';
import type { Shape } from './types';
import { SHAPE } from './types';

interface ShapeInputProps {
	shapeInfo: Shape;
	updateShape: (id: number, key: string, value: unknown) => void;
	moveShape: (id: number, dir: -1 | 1) => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
	children?: React.ReactNode;
}

const entries = Object.entries(SHAPE);
// TODO(bret): might want to memoize this component
export function ShapeInput({
	shapeInfo,
	updateShape,
	moveShape,
	canMoveUp,
	canMoveDown,
	children,
}: ShapeInputProps) {
	const { id, shape, pos, rot, size, sweep = [0, 0], trans } = shapeInfo;

	const key = `shape-${id}`;

	return (
		<div className="shape-input">
			<div className="input-wrapper">
				<span>Shape #{id}</span>
				<div>
					<button
						onClick={() => moveShape(id, -1)}
						disabled={!canMoveUp}
					>
						Move Up
					</button>
					<button
						onClick={() => moveShape(id, 1)}
						disabled={!canMoveDown}
					>
						Move Down
					</button>
				</div>
			</div>
			<hr style={{ width: '100%', borderBottomColor: 'red' }} />
			<div className="input-wrapper">
				<label>Shape</label>
				<select
					name={`${key}-shape`}
					value={shape}
					onChange={(e) => updateShape(id, 'shape', e.target.value)}
				>
					{entries.map(([k, v]) => (
						<option key={k} value={v}>
							{k}
						</option>
					))}
				</select>
			</div>
			<div className="input-wrapper">
				<label>Position</label>
				<Vector2Input
					name={`${key}-pos`}
					value={pos}
					onChange={(v) => updateShape(id, 'pos', v)}
				/>
			</div>
			<div className="input-wrapper">
				<label>Rotation</label>
				<input
					name={`${key}-rot`}
					type="number"
					step={5}
					value={rot}
					onChange={(e) => updateShape(id, 'rot', e.target.value)}
				/>
			</div>
			<div className="input-wrapper">
				<label>Size</label>
				<Vector2Input
					name={`${key}-size`}
					value={size}
					onChange={(v) => updateShape(id, 'size', v)}
				/>
			</div>
			<div className="input-wrapper">
				<label>Sweep</label>
				<Vector2Input
					name={`${key}-sweep`}
					system="polar"
					value={sweep}
					onChange={(v) => updateShape(id, 'sweep', v)}
				/>
			</div>
			<div className="input-wrapper">
				<label>Transparent</label>
				<input
					type="checkbox"
					value={(trans ?? false).toString()}
					onChange={(e) => updateShape(id, 'trans', e.target.checked)}
				/>
			</div>
			{children ? (
				<div className="children">
					<div>Children</div>
					{children}
				</div>
			) : null}
		</div>
	);
}
