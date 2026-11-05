// @ts-nocheck — Three.js sprites expose incomplete ambient types in this project.
import * as THREE from 'three';
import { makePirateSprite } from './pirateSprite.js';

const ACTIONS = [
	{ frame: 0, duration: 1550 }, // draw the pistol
	{ frame: 1, duration: 850 }, // fire at the glass
	{ frame: 2, duration: 2200 }, // study the map
	{ frame: 3, duration: 2200 }, // cutlass parry and lunge
	{ frame: 4, duration: 1850 } // captain's salute
];
const CYCLE_MS = ACTIONS.reduce((sum, item) => sum + item.duration, 0);
const PORTRAITS = [
	'/images/arul-pirate-draw.png',
	'/images/arul-pirate-fire.png',
	'/images/arul-pirate-map.png',
	'/images/arul-pirate-fight.png',
	'/images/arul-pirate-salute.png'
];

function makeGlowTexture() {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 256;
	const context = canvas.getContext('2d');
	const gradient = context.createRadialGradient(128, 128, 4, 128, 128, 126);
	gradient.addColorStop(0, 'rgba(201, 166, 99, .26)');
	gradient.addColorStop(0.38, 'rgba(74, 119, 120, .15)');
	gradient.addColorStop(1, 'rgba(20, 39, 53, 0)');
	context.fillStyle = gradient;
	context.fillRect(0, 0, 256, 256);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

export function createAboutScene(canvas, { reducedMotion = false } = {}) {
	const renderer = new THREE.WebGLRenderer({
		canvas,
		alpha: true,
		antialias: true,
		powerPreference: 'high-performance'
	});
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.12;
	renderer.setClearColor(0x000000, 0);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 60);
	camera.position.set(0, 2.35, 10.2);
	camera.lookAt(0, 2.35, 0);

	const glow = new THREE.Sprite(
		new THREE.SpriteMaterial({ map: makeGlowTexture(), transparent: true, depthWrite: false, toneMapped: false })
	);
	glow.position.set(3.08, 2.35, -0.75);
	glow.scale.set(5.8, 6.3, 1);
	glow.renderOrder = 0;
	scene.add(glow);

	const captain = makePirateSprite(PORTRAITS, {
		width: 3.6,
		height: 5.4,
		frame: 0,
		cutoff: 0.1,
		autoFit: true,
		maxHeight: 5.4,
		maxWidth: 4.55,
		floorY: 0
	});
	captain.sprite.position.set(3.08, captain.sprite.position.y, 0.1);
	const baseX = captain.sprite.position.x;
	scene.add(captain.sprite);

	// Fine, slow-moving sea-spray motes give the cutout a little depth.
	const moteCount = 54;
	const positions = new Float32Array(moteCount * 3);
	const originY = new Float32Array(moteCount);
	const phases = new Float32Array(moteCount);
	for (let i = 0; i < moteCount; i++) {
		positions[i * 3] = (Math.random() - 0.5) * 10;
		positions[i * 3 + 1] = Math.random() * 5.6;
		originY[i] = positions[i * 3 + 1];
		positions[i * 3 + 2] = -0.35 + Math.random() * 1.8;
		phases[i] = Math.random() * Math.PI * 2;
	}
	const moteGeometry = new THREE.BufferGeometry();
	moteGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	const moteMaterial = new THREE.PointsMaterial({
		color: 0xc8b77f,
		size: 2.2,
		sizeAttenuation: false,
		transparent: true,
		opacity: 0.42,
		depthWrite: false,
		toneMapped: false
	});
	const motes = new THREE.Points(moteGeometry, moteMaterial);
	scene.add(motes);

	let width = 1;
	let height = 1;
	let dpr = 1;
	let active = false;
	let raf = 0;
	let startedAt = 0;
	let lastFrame = -1;
	let elapsed = 0;

	function resize() {
		width = canvas.clientWidth || window.innerWidth;
		height = canvas.clientHeight || window.innerHeight;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		renderer.setPixelRatio(dpr);
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		camera.fov = width / height < 0.82 ? 43 : 31;
		camera.updateProjectionMatrix();
		const narrow = width < 760;
		captain.fit(narrow ? 4.45 : 5.4, narrow ? 3.55 : 4.55);
		captain.sprite.position.x = narrow ? 2.45 : baseX;
		captain.setOpacity(narrow ? 0.34 : 1);
		glow.position.x = captain.sprite.position.x;
		if (!active) renderStill();
	}

	function draw(now) {
		if (!active) return;
		if (!reducedMotion) elapsed = now - startedAt;
		let frame = 0;
		let cursor = elapsed % CYCLE_MS;
		for (const action of ACTIONS) {
			if (cursor < action.duration) {
				frame = action.frame;
				break;
			}
			cursor -= action.duration;
		}
		if (frame !== lastFrame) {
			captain.setFrame(frame);
			lastFrame = frame;
		}
		const positions = moteGeometry.attributes.position;
		for (let i = 0; i < moteCount; i++) {
			positions.array[i * 3 + 1] = originY[i] + Math.sin(now * 0.00022 + phases[i]) * 0.13;
		}
		positions.needsUpdate = true;
		captain.sprite.position.x = (width < 760 ? 2.45 : baseX) + Math.sin(now * 0.0007) * (width < 760 ? 0.035 : 0.07);
		captain.sprite.position.y = captain.sprite.userData.floorY + captain.sprite.scale.y / 2 + Math.sin(now * 0.00115) * 0.035;
		captain.sprite.material.rotation = Math.sin(now * 0.0008) * 0.008;
		glow.position.x = captain.sprite.position.x;
		renderer.render(scene, camera);
		raf = requestAnimationFrame(draw);
	}

	function renderStill() {
		if (!renderer) return;
		renderer.render(scene, camera);
	}

	function start() {
		if (active) return;
		active = true;
		startedAt = performance.now() - elapsed;
		if (reducedMotion) {
			captain.setFrame(0);
			renderStill();
			return;
		}
		raf = requestAnimationFrame(draw);
	}

	function stop() {
		active = false;
		cancelAnimationFrame(raf);
		if (reducedMotion) renderStill();
	}

	resize();
	return {
		start,
		stop,
		resize,
		renderStill,
		dispose() {
			stop();
			scene.traverse((object) => {
				if (object === captain.sprite) return;
				object.geometry?.dispose?.();
				const material = object.material;
				if (material) {
					for (const item of Array.isArray(material) ? material : [material]) {
						item.map?.dispose?.();
						item.dispose?.();
					}
				}
			});
			captain.dispose();
			renderer.dispose();
		}
	};
}
