import { useEffect, useState } from 'react';
import Victor from 'victor';
import * as twgl from 'twgl.js';
import { Canvas } from './Canvas';
import basicVert from '../js/shaders/basic.vert';
import shapeFrag from '../js/shaders/shape.glsl';
import shapeSweepFrag from '../js/shaders/shape-sweep.glsl';
import mergeFrag from '../js/shaders/merge.glsl';
import colorFrag from '../js/shaders/color.glsl';
import solidColorFrag from '../js/shaders/solid-color.glsl';
import textureFrag from '../js/shaders/texture.glsl';

function App() {
	const [gl, setGL] = useState<WebGL2RenderingContext>();

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

		const shapeProgram = createFragShader(shapeFrag);
		const shapeSweepProgram = createFragShader(shapeSweepFrag);
		const mergeProgram = createFragShader(mergeFrag);
		const colorProgram = createFragShader(colorFrag);
		const solidColorProgram = createFragShader(solidColorFrag);
		const textureProgram = createFragShader(textureFrag);

		const fbis = Array.from({ length: 6 }, () =>
			twgl.createFramebufferInfo(gl),
		);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- it fine
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

		const SHAPE = {
			ELLIPSE: 0,
			BOX: 1,
		} as const;

		// const sweep = [0.4, 0];
		const sweep = [0.15, -0.15] as [number, number];
		const rectSize = [0.1, 0.3] as [number, number];
		interface Shape {
			shape: (typeof SHAPE)[keyof typeof SHAPE];
			size: [number, number];
			sweep?: [number, number];
			pos?: [number, number];
			trans?: boolean;
		}
		const shapes: Shape[] = [
			{
				shape: SHAPE.ELLIPSE,
				size: [0.2, 0.4],
				sweep,
				pos: [-0.5, 0.5],
				// trans: true,
			},
			{
				shape: SHAPE.BOX,
				size: rectSize,
				sweep,
				// trans: true,
				pos: [0, 0],
			},
			{
				shape: SHAPE.BOX,
				size: rectSize,
				trans: true,
				pos: [0, 0],
			},
			{
				shape: SHAPE.BOX,
				pos: [0.2, 0.4],
				size: [0.1, 0.1],
				sweep,
				// trans: true,
			},
			{
				shape: SHAPE.BOX,
				pos: [-0.2, -0.4],
				size: [0.1, 0.1],
				sweep,
				// trans: true,
			},
		];

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

			type Uniforms = {
				pos?: [number, number];
				sweep?: [number, number];
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
			const sweptShapes = shapes.filter(({ sweep }) => sweep);
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
			handle = requestAnimationFrame(render);
		}
		handle = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(handle);
		};
	}, [gl]);

	return (
		<>
			<Canvas />
		</>
	);
}

export default App;
