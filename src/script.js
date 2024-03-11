import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { CCapture } from 'ccapture.js-npmfixed';

import waterVertexShader from './shaders/water/vertex.glsl';
import waterFragmentShader from './shaders/water/fragment.glsl';

/**
 * Base
 */
// Debug
const gui = new GUI();
const debugParams = {};

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Video Capture
let isCapturing = false;
let captureStartTime;
let strDownloadMime = 'image/octet-stream';

// GUI controller
const controller = {
	name: 'pattern_',
	startCapture: function () {
		if (!isCapturing) {
			capturer.start();
			isCapturing = true;
			captureStartTime = Date.now(); // reset the capture start time when starting capture
		}
	},
	stopCapture: function () {
		if (isCapturing) {
			capturer.stop();
			capturer.save();
			isCapturing = false;
		}
	},
	saveAsImage: function () {
		let imgData;

		try {
			var strMime = 'image/jpeg';
			imgData = renderer.domElement.toDataURL(strMime);

			saveFile(imgData.replace(strMime, strDownloadMime), `${this.name}.jpg`);
		} catch (e) {
			console.log(e);
			return;
		}
	}
};

const saveFile = function (strData, filename) {
	var link = document.createElement('a');
	if (typeof link.download === 'string') {
		document.body.appendChild(link); //Firefox requires the link to be in the body
		link.download = filename;
		link.href = strData;
		link.click();
		document.body.removeChild(link); //remove the link when done
	} else {
		location.replace(uri);
	}
};

/**
 * Add controls function to GUI Panel
 * I use lil-gui package https://www.npmjs.com/package/lil-gui
 **/
gui.add(controller, 'startCapture').name('Start Capture');
gui.add(controller, 'stopCapture').name('Stop Capture');
gui.add(controller, 'saveAsImage').name('Save As Image');
gui.add(controller, 'name');

// New instance of CCapture with option
const capturer = new CCapture({
	format: 'webm',
	framerate: 60,
	verbose: true,
	name: controller.name
});

// Axes helper
// const axesHelper = new THREE.AxesHelper();
// axesHelper.position.y += 0.25;
// scene.add(axesHelper);

/**
 * Center circle
 */
// Geometry
const geometry = new THREE.PlaneGeometry(2, 2, 768, 768);
geometry.deleteAttribute('normal');
geometry.deleteAttribute('uv');

// Material
debugParams.depthColor = '#000000';
debugParams.surfaceColor = '#ff0000';

const waterMaterial = new THREE.ShaderMaterial({
	// wireframe: true,
	vertexShader: waterVertexShader,
	fragmentShader: waterFragmentShader,
	uniforms: {
		uBigWavesElevation: new THREE.Uniform(0.0),
		uBigWavesFrequency: new THREE.Uniform(new THREE.Vector2(0, 0)),
		uBigWavesSpeed: new THREE.Uniform(2.083),
		uTime: new THREE.Uniform(2),
		uColorOffset: new THREE.Uniform(0.152),
		uColorMultiplier: new THREE.Uniform(0.782),
		uDepthColor: new THREE.Uniform(new THREE.Color(debugParams.depthColor)),
		uSurfaceColor: new THREE.Uniform(new THREE.Color(debugParams.surfaceColor)),
		uShift: new THREE.Uniform(0.039)
	}
});

// Mesh
const mesh = new THREE.Mesh(geometry, waterMaterial);
mesh.rotation.x = -Math.PI * 0.5;

scene.add(mesh);

gui
	.add(waterMaterial.uniforms.uBigWavesElevation, 'value')
	.min(0)
	.max(1)
	.step(0.001)
	.name('uBigWavesElevation');
gui
	.add(waterMaterial.uniforms.uBigWavesSpeed, 'value')
	.min(0)
	.max(4)
	.step(0.001)
	.name('uBigWavesSpeed');
gui
	.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x')
	.min(0)
	.max(10)
	.step(0.001)
	.name('uBigWavesFrequencyX');
gui
	.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y')
	.min(0)
	.max(10)
	.step(0.001)
	.name('uBigWavesFrequencyY');
gui.addColor(debugParams, 'depthColor').onChange(() => {
	waterMaterial.uniforms.uDepthColor.value.set(debugParams.depthColor);
});
gui.addColor(debugParams, 'surfaceColor').onChange(() => {
	waterMaterial.uniforms.uSurfaceColor.value.set(debugParams.surfaceColor);
});
gui
	.add(waterMaterial.uniforms.uColorOffset, 'value')
	.min(0)
	.max(1)
	.step(0.001)
	.name('uColorOffset');
gui
	.add(waterMaterial.uniforms.uColorMultiplier, 'value')
	.min(0)
	.max(10)
	.step(0.001)
	.name('uColorMultiplier');
gui.add(waterMaterial.uniforms.uShift, 'value').min(0).max(0.5).step(0.001).name('uShift');

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight
};

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
// const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
const camera = new THREE.OrthographicCamera(
	sizes.width / -sizes.width,
	sizes.width / sizes.width,
	sizes.height / sizes.height,
	sizes.height / -sizes.height,
	1,
	1000
);
camera.position.set(0, 1, 0);
camera.lookAt(0, 0, 0);
scene.add(camera);

// Controls
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas
});

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Update controls
	// controls.update();

	// Update material
	waterMaterial.uniforms.uTime.value = elapsedTime;

	// Render
	renderer.render(scene, camera);

	// Capture frame
	if (isCapturing) {
		capturer.capture(renderer.domElement);
	}

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
