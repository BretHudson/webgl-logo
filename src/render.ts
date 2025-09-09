function render(gl: WebGL2RenderingContext) {
	return (time: number) => {
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

		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- it fine
		const sweep2 = (
			programInfo: twgl.ProgramInfo,
			fbi: twgl.FramebufferInfo,
			uniforms: Uniforms = {},
		) => {
			clearBuffer(fbi);
			const { pos = [0, 0], sweep = [0, 0] } = uniforms;

			const v = Victor.fromArray(pos);
			const rd = Victor.fromArray(sweep);

			// draw at start
			draw(programInfo, fbiTemp2, {
				...uniforms,
				pos: v.toArray(),
			});
			merge(fbi, fbiTemp2);

			// draw at end
			v.add(rd);
			draw(programInfo, fbiTemp2, {
				...uniforms,
				pos: v.toArray(),
			});
			v.subtract(rd);
			merge(fbi, fbiTemp2);

			const n = rd.length();
			console.log(n);
			// const n = 0.01;
			rd.normalize();
			const stepF = 0.0025;
			const step = rd.clone().multiply(new Victor(stepF, stepF));

			for (let i = 0; i < n; i += stepF) {
				// const _v = v.clone();
				v.add(step);
				console.log(v.toString());
				draw(programInfo, fbiTemp2, {
					...uniforms,
					pos: v.toArray(),
				});
				merge(fbi, fbiTemp2);
			}

			clearBuffer(fbiTemp2);
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
	};
}
