import { SHAPE } from './types';
import type { Shape } from './types';

interface ShapeInputProps {
	shape: Shape;
	onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const entries = Object.entries(SHAPE);
export function ShapeInput({ shape, onChange }: ShapeInputProps) {
	return (
		<div>
			<select value={shape.shape} onChange={onChange}>
				{entries.map(([k, v]) => (
					<option key={k} value={v}>
						{k}
					</option>
				))}
			</select>
			type: {shape.shape}
		</div>
	);
}
