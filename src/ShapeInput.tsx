import { SHAPE } from './types';
import type { Shape } from './types';

const entries = Object.entries(SHAPE);
export function ShapeInput({ shape }: { shape: Shape }) {
	return (
		<div>
			<select value={shape.shape} onChange={(e) => e}>
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
