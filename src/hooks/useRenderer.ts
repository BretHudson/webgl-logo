import { useEffect, useState } from 'react';
import * as twgl from 'twgl.js';
import basicVert from '../../js/shaders/basic.vert';
import colorFrag from '../../js/shaders/color.glsl';
import mergeFrag from '../../js/shaders/merge.glsl';
import shapeSweepFrag from '../../js/shaders/shape-sweep.glsl';
import shapeFrag from '../../js/shaders/shape.glsl';
import solidColorFrag from '../../js/shaders/solid-color.glsl';
import textureFrag from '../../js/shaders/texture.glsl';
import type { Shape } from '../types';

export interface ShapeOrderItem {
	nodeId: number;
	childrenItems?: ShapeOrderItem[];
}

export interface GLRef {
	shapes: Shape[];
	shapeOrder: ShapeOrderItem[];
}

export function useRenderer(ref: React.RefObject<GLRef>) {
	const [gl, setGL] = useState<WebGL2RenderingContext | null>(null);

	useEffect(() => {
		twgl.setDefaults({ attribPrefix: 'a_' });
		const gl = (
			document.getElementById('c') as HTMLCanvasElement
		).getContext('webgl2');
		if (!gl) throw new Error('webgl2 could not be initialized');
		setGL(gl);

		return () => {
			setGL(null);
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

		const fbis = Array.from({ length: 16 }, () =>
			twgl.createFramebufferInfo(gl),
		);
		// a  eslint-disable-next-line @typescript-eslint/no-unused-vars
		// const [fbiTemp, fbiTemp2, fbiA, fbiB, fbiC, fbiD, fbiX, fbiY] = fbis;
		const freeFbis = [...fbis];
		const alloc = () => {
			const fbi = freeFbis.pop();
			if (!fbi) throw new Error('all out of framebuffers');
			clearBuffer(fbi);
			return fbi;
		};
		const free = (fbi: twgl.FramebufferInfo) => {
			freeFbis.push(fbi);
		};

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

			const { shapes, shapeOrder } = ref.current;

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
				pos: [0, 0],
				origin: [0, 0],
				rot: 0,
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
				const fbiTemp = alloc();
				draw(mergeProgram, fbiTemp, {
					u_textureA: srcA.attachments[0],
					u_textureB: srcB.attachments[0],
				});

				draw(textureProgram, srcA, {
					u_texture: fbiTemp.attachments[0],
					origin: [0.5, 0.5],
				});
				free(fbiTemp);
			};

			// draw background color
			draw(solidColorProgram, null);

			const drawShape = (shape: Shape, target: twgl.FramebufferInfo) => {
				if (shape.sweep && shape.sweep[0] > 0) {
					const fbiA = alloc();
					const fbiB = alloc();
					draw(shapeSweepProgram, fbiA, shape);
					draw(colorProgram, fbiB, {
						color: [1, 0.5, 1, 0.8],
						maskTexture: fbiA.attachments[0],
					});
					draw(textureProgram, target, {
						u_texture: fbiB.attachments[0],
						origin: [0.5, 0.5],
					});
					free(fbiA);
					free(fbiB);
				}

				if (!shape.trans) {
					const fbiA = alloc();
					const fbiB = alloc();
					draw(shapeProgram, fbiA, shape);
					draw(colorProgram, fbiB, {
						color: [1, 0.5, 1, 1],
						maskTexture: fbiA.attachments[0],
					});
					draw(textureProgram, target, {
						u_texture: fbiB.attachments[0],
					});
					free(fbiA);
					free(fbiB);
				}
			};

			const drawItems = (
				items: ShapeOrderItem[],
				target: twgl.FramebufferInfo,
			) => {
				for (let i = 0; i < items.length; ++i) {
					const fbi = alloc();
					const item = items[i];

					const shape = shapes.find(({ id }) => id === item.nodeId);
					if (!shape) throw new Error('???');

					if (shape.shape > 0) {
						drawShape(shape, fbi);
					} else if (item.childrenItems) {
						const groupFbi = alloc();
						drawItems(item.childrenItems, groupFbi);
						draw(textureProgram, fbi, {
							u_texture: groupFbi.attachments[0],
							...shape,
							origin: [0.5, 0.5],
						});
						free(groupFbi);
					}
					merge(target, fbi);
					free(fbi);
				}
			};

			const fbi = alloc();
			drawItems(shapeOrder, fbi);

			draw(textureProgram, null, {
				u_texture: fbi.attachments[0],
				pos: [0, 0],
				origin: [0.5, 0.5],
				rot: 0,
			});
			free(fbi);

			// console.timeEnd('render');
			// handle = requestAnimationFrame(render);
		}
		handle = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(handle);
		};
	}, [
		gl,
		ref,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		...[
			shapeFrag,
			shapeSweepFrag,
			mergeFrag,
			colorFrag,
			solidColorFrag,
			textureFrag,
		],
	]);
}
