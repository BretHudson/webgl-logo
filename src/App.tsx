import { useCallback, useEffect, useState } from 'react';
import * as twgl from 'twgl.js';
import Victor from 'victor';
import basicVert from '../js/shaders/basic.vert';
import colorFrag from '../js/shaders/color.glsl';
import mergeFrag from '../js/shaders/merge.glsl';
import shapeSweepFrag from '../js/shaders/shape-sweep.glsl';
import shapeFrag from '../js/shaders/shape.glsl';
import solidColorFrag from '../js/shaders/solid-color.glsl';
import textureFrag from '../js/shaders/texture.glsl';
import { Canvas } from './Canvas';
import { ShapeInput } from './ShapeInput';
import type { Shape, Uniforms, Vec2 } from './types';
import { hashShape, SHAPE } from './types';

// const sweep: Vec2 = [0.15, -0.15];
const sweep: Vec2 = [0.15, -45];
const rectSize: Vec2 = [0.1, 0.3];
function App() {
	const [gl, setGL] = useState<WebGL2RenderingContext>();

	const [shapes, setShapes] = useState<Shape[]>([
		{
			id: 0,
			shape: SHAPE.ELLIPSE,
			pos: [-0.5, 0.5],
			rot: 0,
			size: [0.2, 0.4],
			sweep: [...sweep],
		},
		{
			id: 1,
			shape: SHAPE.BOX,
			pos: [0, 0],
			rot: 0,
			size: [...rectSize],
			sweep: [...sweep],
		},
		{
			id: 2,
			shape: SHAPE.BOX,
			pos: [0, 0.75],
			rot: 45,
			size: [0.1, 0.1],
			sweep: [...sweep],
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

	const [shapeOrder, setShapeOrder] = useState([0, 1, 2, 3, 4]);

	useEffect(() => {
		twgl.setDefaults({ attribPrefix: 'a_' });
		const gl = (
			document.getElementById('c') as HTMLCanvasElement
		).getContext('webgl2');
		if (!gl) throw new Error('webgl2 could not be initialized');
		setGL(gl);

		return () => {
			setGL(undefined);
		};
	}, []);

	useEffect(() => {
		if (!gl) return;

		const createFragShader = (frag: string) => {
			return twgl.createProgramInfo(gl, [basicVert, frag]);
		};

		const [
			shapeProgram,
			shapeSweepProgram,
			mergeProgram,
			colorProgram,
			solidColorProgram,
			textureProgram,
		] = [
			shapeFrag,
			shapeSweepFrag,
			mergeFrag,
			colorFrag,
			solidColorFrag,
			textureFrag,
		].map(createFragShader);

		const fbis = Array.from({ length: 6 }, () =>
			twgl.createFramebufferInfo(gl),
		);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [fbiTemp, fbiTemp2, fbiA, fbiB, fbiC, fbiD] = fbis;

		const arrays = {
			position: [
				[-1, -1, 0],
				[1, -1, 0],
				[-1, 1, 0],
				[-1, 1, 0],
				[1, -1, 0],
				[1, 1, 0],
			].flat(),
		};
		const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

		let handle = 0;

		const clearBuffer = (fbi: twgl.FramebufferInfo) => {
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbi.framebuffer);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		};

		function render(time: number) {
			if (!gl) return;
			// console.time('render');
			twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
			const resolution = [gl.canvas.width, gl.canvas.height] as const;
			gl.viewport(0, 0, ...resolution);

			const resizeArgs = [undefined, ...resolution] as const;
			fbis.forEach((fbi) => {
				twgl.resizeFramebufferInfo(gl, fbi, ...resizeArgs);
			});

			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			const commonUniforms = {
				u_time: time * 0.001,
				u_resolution: resolution,
			};

			const draw = (
				programInfo: twgl.ProgramInfo,
				fbi: twgl.FramebufferInfo | null = null,
				uniforms = {},
			) => {
				twgl.bindFramebufferInfo(gl, fbi);
				gl.useProgram(programInfo.program);
				twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
				twgl.setUniforms(programInfo, {
					...commonUniforms,
					...uniforms,
				});
				twgl.drawBufferInfo(gl, bufferInfo);
			};

			const merge = (
				srcA: twgl.FramebufferInfo,
				srcB: twgl.FramebufferInfo,
			) => {
				draw(mergeProgram, fbiTemp, {
					u_textureA: srcA.attachments[0],
					u_textureB: srcB.attachments[0],
				});

				draw(textureProgram, srcA, {
					u_texture: fbiTemp.attachments[0],
				});
				clearBuffer(fbiTemp);
			};

			const sweep = (
				programInfo: twgl.ProgramInfo,
				fbi: twgl.FramebufferInfo,
				uniforms: Uniforms = {},
			) => {
				clearBuffer(fbi);

				const { pos = [0, 0] } = uniforms;

				programInfo = shapeSweepProgram;

				const v = Victor.fromArray(pos);
				// const rd = Victor.fromArray(sweep);

				draw(programInfo, fbi, {
					...uniforms,
					pos: v.toArray(),
				});
			};

			// draw sweeps
			const sweptShapes = shapes.filter(({ sweep }) => sweep?.[0]);
			if (sweptShapes.length > 0) {
				sweep(shapeProgram, fbiA, sweptShapes[0]);
				for (let i = 1, n = sweptShapes.length; i < n; ++i) {
					sweep(shapeProgram, fbiB, sweptShapes[i]);
					merge(fbiA, fbiB);
					clearBuffer(fbiB);
				}
			}

			// draw color
			draw(colorProgram, fbiC, {
				color: [1, 0.5, 1, 0.8],
				// color: [1, 0.5, 1, 1],
				maskTexture: fbiA.attachments[0],
			});

			// draw shapes

			clearBuffer(fbiA);
			clearBuffer(fbiB);

			const solidShapes = shapes.filter(({ trans }) => !trans);
			if (solidShapes.length > 0) {
				draw(shapeProgram, fbiA, solidShapes[0]);
				for (let i = 1, n = solidShapes.length; i < n; ++i) {
					draw(shapeProgram, fbiB, solidShapes[i]);
					merge(fbiA, fbiB);
					clearBuffer(fbiB);
				}
			}

			draw(colorProgram, fbiD, {
				color: [1, 0.5, 1, 1],
				maskTexture: fbiA.attachments[0],
			});

			// draw background color
			draw(solidColorProgram, null);

			// draw texture to canvas
			draw(textureProgram, null, {
				u_texture: fbiC.attachments[0],
			});

			draw(textureProgram, null, {
				u_texture: fbiD.attachments[0],
			});
			// console.timeEnd('render');
			// handle = requestAnimationFrame(render);
		}
		handle = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(handle);
		};
	}, [gl, shapes]);

	const updateShape = useCallback(
		(id: number, key: string, value: unknown) => {
			setShapes((shapes) => {
				const item = shapes.find(({ id: _id }) => _id === id);
				if (!item) throw new Error('???');
				const newShapes = [...shapes];
				newShapes[id] = {
					...item,
					[key]: value,
				};
				return newShapes;
			});
		},
		[],
	);

	const moveShape = useCallback((id: number, dir: -1 | 1) => {
		setShapeOrder((shapeOrder) => {
			const index = shapeOrder.indexOf(id);
			const newIndex = index + dir;
			if (newIndex < 0 || newIndex >= shapeOrder.length)
				return shapeOrder;

			const newShapeOrder = [...shapeOrder];
			const item = newShapeOrder.splice(index, 1);
			newShapeOrder.splice(newIndex, 0, ...item);
			return newShapeOrder;
		});
	}, []);

	return (
		<div className="grid">
			<div className="shape-inputs">
				{shapeOrder.map((id, i) => {
					const first = i === 0;
					const last = i === shapeOrder.length - 1;
					const shape = shapes.find(({ id: _id }) => _id === id);
					if (!shape) throw new Error('???');
					return (
						<ShapeInput
							key={hashShape(shape)}
							shapeInfo={shape}
							updateShape={updateShape}
							moveShape={moveShape}
							canMoveUp={!first}
							canMoveDown={!last}
						/>
					);
				})}
			</div>
			<Canvas />
		</div>
	);
}

export default App;
