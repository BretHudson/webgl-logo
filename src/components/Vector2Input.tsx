type Vec2 = [number, number];
export function Vector2Input({
	name,
	// system = 'cartesian',
	value,
	onChange,
}: {
	name: string;
	system?: 'cartesian' | 'polar';
	value: Vec2;
	onChange: (v: Vec2) => void;
}) {
	return (
		<div className="vector2-input">
			<input
				name={`${name}-x`}
				type="number"
				step=".1"
				value={value[0]}
				onChange={(e) => {
					onChange([+e.target.value, value[1]]);
				}}
			/>
			<input
				name={`${name}-y`}
				type="number"
				step=".1"
				value={value[1]}
				onChange={(e) => {
					onChange([value[0], +e.target.value]);
				}}
			/>
		</div>
	);
}
