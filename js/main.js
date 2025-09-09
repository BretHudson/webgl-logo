// Load shaders
const shaders = [...document.querySelectorAll('[src][type="notjs"]')];

// TODO(bret): cache the shaders

const loadShader = async (src) => {
	return fetch(src)
		.then((res) => res.text())
		.then(async (text) => {
			const regex = /#include "(?<fileName>[\w\/\.\-\_]+)"/g;

			const matches = text.matchAll(regex);

			const replacements = await Promise.all(
				matches.map((match) => {
					const { fileName } = match.groups;
					// TODO(bret): this hack is gonna break at some point probably
					return loadShader(src + '/../' + fileName).then(
						(content) => [fileName, content],
					);
				}),
			);

			let finalText = text;
			replacements.forEach(([fileName, content]) => {
				finalText = finalText.replace(
					`#include "${fileName}"`,
					content,
				);
			});

			return finalText;
		});
};

const promises = shaders.map(async (shader) => {
	shader.text = await loadShader(shader.src);
});
await Promise.all(promises);

// Init WebGL/TWGL
twgl.setDefaults({ attribPrefix: 'a_' });
const gl = document.getElementById('c').getContext('webgl2');

const createFragShader = (frag) => {
	return twgl.createProgramInfo(gl, ['basic-vert', frag]);
};

const shapeProgram = createFragShader('shape-frag');
const shapeSweepProgram = createFragShader('shape-sweep-frag');
const mergeProgram = createFragShader('merge-frag');
const colorProgram = createFragShader('color-frag');
const solidColorProgram = createFragShader('solid-color-frag');
const textureProgram = createFragShader('texture-frag');

const fbis = Array.from({ length: 6 }, () => twgl.createFramebufferInfo(gl));
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
};

// const sweep = [0.4, 0];
const sweep = [0.15, -0.15];
const rectSize = [0.1, 0.3];
const shapes = [
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

const clearBuffer = (fbi) => {
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbi.framebuffer);
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

function render(time) {
	// console.time('render');
	twgl.resizeCanvasToDisplaySize(gl.canvas);
	const resolution = [gl.canvas.width, gl.canvas.height];
	gl.viewport(0, 0, ...resolution);

	const resizeArgs = [undefined, ...resolution];
	fbis.forEach((fbi) => {
		twgl.resizeFramebufferInfo(gl, fbi, ...resizeArgs);
	});

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	const commonUniforms = {
		u_time: time * 0.001,
		u_resolution: resolution,
	};

	const draw = (programInfo, fbi = null, uniforms = {}) => {
		twgl.bindFramebufferInfo(gl, fbi);
		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
		twgl.setUniforms(programInfo, {
			...commonUniforms,
			...uniforms,
		});
		twgl.drawBufferInfo(gl, bufferInfo);
	};

	const merge = (srcA, srcB) => {
		draw(mergeProgram, fbiTemp, {
			u_textureA: srcA.attachments[0],
			u_textureB: srcB.attachments[0],
		});

		draw(textureProgram, srcA, {
			u_texture: fbiTemp.attachments[0],
		});
		clearBuffer(fbiTemp);
	};

	const sweep = (programInfo, fbi = null, uniforms = {}) => {
		clearBuffer(fbi);

		const { pos = [0, 0], sweep } = uniforms;

		programInfo = shapeSweepProgram;

		const v = Victor.fromArray(pos);
		const rd = Victor.fromArray(sweep);

		draw(programInfo, fbi, {
			...uniforms,
			pos: v.toArray(),
		});
	};

	const sweep2 = (programInfo, fbi = null, uniforms = {}) => {
		clearBuffer(fbi);
		const { pos = [0, 0], sweep } = uniforms;

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
	requestAnimationFrame(render);
}
requestAnimationFrame(render);
