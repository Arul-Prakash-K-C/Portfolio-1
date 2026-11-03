// @ts-nocheck — three ships no bundled types; this file is checked by running it.
/**
 * The Voyage scene: a cinematic, asset-free Three.js scene with a
 * Gerstner-wave ocean, fog banks, a starfield, distant islands and an
 * original galleon (see galleon.js). On capable devices it runs through
 * a film-style post chain: bloom, colour grade, grain and vignette.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { makeGalleon } from './galleon.js';
import { makeMaterials, makeWheel, makeCaptain, makeChartTable, makeChest, MAP_SPOTS } from './props.js';
import { makeSignalIsle } from './island.js';
import { makePort } from './ports.js';
import { makeOcean, makeReflection, makeSpray, waveHeight, SAIL_SPEED } from './ocean.js';

const FOG = new THREE.Color('#0d1a2e');
const MOON_POS = new THREE.Vector3(160, 74, -190);

/* ------------------------------------------------------------------ */
/* Sky, moon, clouds, stars, islands, fog banks                        */
/* ------------------------------------------------------------------ */
function makeSky() {
	const mat = new THREE.ShaderMaterial({
		side: THREE.BackSide,
		depthWrite: false,
		uniforms: {
			uTime: { value: 0 },
			uTop: { value: new THREE.Color('#010309') },
			uMid: { value: new THREE.Color('#0a1830') },
			uHorizon: { value: FOG },
			uMoonDir: { value: MOON_POS.clone().normalize() }
		},
		vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
		fragmentShader: `uniform vec3 uTop,uMid,uHorizon,uMoonDir; uniform float uTime; varying vec3 vP;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
      void main(){
        float y = vP.y;
        vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.2, y));
        c = mix(c, uTop, smoothstep(0.2, 0.75, y));
        // moon glow
        float m = max(dot(vP, uMoonDir), 0.0);
        c += vec3(0.95, 0.85, 0.65) * (pow(m, 60.0) * 0.45 + pow(m, 10.0) * 0.05);
        // drifting clouds lit from the moon side
        vec2 uv = vP.xz / (y + 0.25) * 1.6 + vec2(uTime * 0.004, 0.0);
        float cl = smoothstep(0.5, 0.85, fbm(uv * 1.3));
        vec3 cloudCol = mix(vec3(0.025, 0.04, 0.075), vec3(0.26, 0.27, 0.3), pow(m, 6.0));
        c = mix(c, cloudCol, cl * smoothstep(0.02, 0.2, y) * 0.7);
        gl_FragColor = vec4(c, 1.0);
      }`
	});
	return { mesh: new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), mat), mat };
}

function makeStars(count) {
	const pos = new Float32Array(count * 3);
	const size = new Float32Array(count);
	for (let i = 0; i < count; i++) {
		const u = Math.random();
		const v = Math.random() * 0.88 + 0.1;
		const theta = 2 * Math.PI * u;
		const phi = Math.acos(1 - v);
		const r = 420;
		pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
		pos[i * 3 + 1] = r * Math.cos(phi);
		pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
		size[i] = Math.pow(Math.random(), 3) * 2.4 + 0.5;
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
	const mat = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
		vertexShader: `attribute float aSize; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vA = 0.55 + 0.45 * sin(uTime * 0.9 + position.x * 0.13 + position.z * 0.07);
        gl_PointSize = aSize * uPx * 1.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
		fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(0.95,0.93,0.86), vA * smoothstep(0.5, 0.0, d)); }`
	});
	return { points: new THREE.Points(geo, mat), mat };
}

function makeMoon() {
	const g = new THREE.Group();
	const tex = (() => {
		const c = document.createElement('canvas');
		c.width = c.height = 256;
		const ctx = c.getContext('2d');
		const grd = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
		grd.addColorStop(0, '#fff7e4');
		grd.addColorStop(0.9, '#f1e3c2');
		grd.addColorStop(1, '#d8c69f');
		ctx.fillStyle = grd;
		ctx.beginPath();
		ctx.arc(128, 128, 126, 0, Math.PI * 2);
		ctx.fill();
		// maria
		for (const [x, y, r, a] of [
			[95, 100, 34, 0.12],
			[150, 80, 22, 0.1],
			[160, 150, 40, 0.09],
			[110, 165, 20, 0.1],
			[70, 140, 16, 0.08]
		]) {
			ctx.fillStyle = `rgba(150,135,110,${a})`;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	})();
	const disc = new THREE.Mesh(
		new THREE.CircleGeometry(8, 64),
		new THREE.MeshBasicMaterial({ map: tex, fog: false, toneMapped: false, transparent: true })
	);
	g.add(disc);
	return g;
}

function makeIslands() {
	const g = new THREE.Group();
	const mat = new THREE.MeshBasicMaterial({ color: '#0a1424', fog: true });
	const specs = [
		[-90, -150, 18, 12],
		[-62, -160, 11, 7],
		[80, -175, 24, 15],
		[112, -160, 10, 6],
		[15, -200, 30, 9]
	];
	for (const [x, z, r, h] of specs) {
		const geo = new THREE.ConeGeometry(r, h, 9, 3);
		const p = geo.attributes.position;
		for (let i = 0; i < p.count; i++) {
			const y = p.getY(i);
			if (y < h / 2 - 0.01) {
				const n = Math.sin(p.getX(i) * 0.7) * Math.cos(p.getZ(i) * 0.5) * 1.6;
				p.setY(i, y + n * 0.6);
			}
		}
		const m = new THREE.Mesh(geo, mat);
		m.position.set(x, h / 2 - 1.5, z);
		m.scale.z = 0.45;
		g.add(m);
	}
	return g;
}

function makeFogBanks() {
	const g = new THREE.Group();
	const mat = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color('#5d6f8a') } },
		vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
		fragmentShader: `uniform float uTime; uniform vec3 uCol; varying vec2 vUv; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * noise(p); p *= 2.1; a *= 0.5; } return s; }
      void main(){
        vec2 p = vec2(vW.x * 0.05 + uTime * 0.012, vUv.y * 2.0);
        float n = fbm(p * vec2(1.0, 1.6));
        float a = smoothstep(0.35, 0.8, n) * smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.45, 1.0, vUv.y));
        a *= smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
        float dist = length(vW - cameraPosition);
        a *= smoothstep(6.0, 20.0, dist);
        gl_FragColor = vec4(uCol, a * 0.28);
      }`
	});
	const banks = [
		[0, 1.6, -55, 170, 7],
		[-20, 1.4, -85, 220, 9]
	];
	for (const [x, y, z, w, h] of banks) {
		const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
		m.position.set(x, y, z);
		g.add(m);
	}
	return { group: g, mat };
}

/* ------------------------------------------------------------------ */
/* Film look: grade, vignette, grain, slight chromatic fringe          */
/* ------------------------------------------------------------------ */
const FilmShader = {
	uniforms: {
		tDiffuse: { value: null },
		uTime: { value: 0 },
		uRes: { value: new THREE.Vector2(1, 1) }
	},
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
	fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 off = c * r2 * 0.006;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      // teal shadows / amber highlights
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(col, col * vec3(0.86, 1.0, 1.08), (1.0 - smoothstep(0.0, 0.35, l)) * 0.6);
      col = mix(col, col * vec3(1.08, 1.0, 0.88), smoothstep(0.45, 1.0, l) * 0.5);
      // vignette
      col *= 1.0 - smoothstep(0.18, 0.75, r2 * 1.6) * 0.55;
      // grain
      float g = hash(vUv * uRes + fract(uTime * 13.0)) - 0.5;
      col += g * 0.02;
      gl_FragColor = vec4(col, 1.0);
    }`
};


/* ------------------------------------------------------------------ */
/* Story timeline                                                       */
/* ------------------------------------------------------------------ */
/*
 * The page drives a single number, `t`, from 0 to 5:
 *   0 opening (the ship at sea) · 1 about (captain at the wheel)
 *   2 skills (chart table + compass) · 3 projects (map destinations)
 *   4 experience (the logbook) · 5 contact (the signal isle and chest)
 * Camera keys are in the ship's anchor space so the shots stay framed on
 * the deck; `follow` blends in the ship's own rocking for deck close-ups.
 */
const STAGE_KEYS = [
	// t, camera position, look target, follow, screen offset (fraction of width, desktop only)
	{ t: 0.5, pos: [-1.0, 4.4, 7.8], look: [-3.8, 2.4, 0], follow: 0.5, offset: 0.1 },
	{ t: 1, pos: [-3.3, 3.12, 2.1], look: [-4.98, 2.66, 0.08], follow: 1, offset: 0.0 },
	{ t: 2, pos: [-1.3, 2.9, 1.6], look: [-1.86, 1.32, -0.04], follow: 1, offset: 0.2 },
	{ t: 3, pos: [-2.0, 3.05, 0.78], look: [-2.03, 1.33, -0.02], follow: 1, offset: -0.2 },
	{ t: 4, pos: [-17, 2.7, 11.5], look: [3, 2.2, 3.2], follow: 0.15, offset: 0.2 }, // outside: the ship passing each port
	{ t: 4.5, pos: [0.2, 3.0, 3.2], look: [8, 2, -2], follow: 0.7, offset: 0.12 },
	{ t: 5, pos: [1.0, 1.85, 1.6], look: [12, 0.95, -3.5], follow: 0.4, offset: 0.18 }
];
const ISLE_POS = new THREE.Vector3(58, 0, -26); // anchor space, ahead of the bow

const smooth = (e0, e1, x) => {
	const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
	return t * t * (3 - 2 * t);
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ quality?: 'high'|'low', destinations?: {title:string}[], intro?: boolean, onIntroEnd?: () => void, onFrame?: (haze: number) => void, onPin?: (x: number, y: number, on: number) => void, ports?: {kind: string}[] }} [opts]
 */
export function createVoyage(canvas, opts = {}) {
	const low = opts.quality === 'low';
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
	const dpr = Math.min(window.devicePixelRatio || 1, low ? 1.25 : 1.5);
	renderer.setPixelRatio(dpr);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.15;
	renderer.setClearColor(FOG);

	const scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(FOG, 0.0095);
	const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 1200);

	const sky = makeSky();
	scene.add(sky.mesh);
	const stars = makeStars(low ? 900 : 2200);
	stars.mat.uniforms.uPx.value = dpr;
	scene.add(stars.points);
	const moon = makeMoon();
	moon.position.copy(MOON_POS);
	moon.lookAt(0, 0, 0);
	scene.add(moon);
	scene.add(makeIslands());
	const fog = makeFogBanks();
	scene.add(fog.group);
	const ocean = makeOcean(low ? 180 : 300, { fog: FOG, moonDir: MOON_POS.clone().normalize(), reflections: !low });
	scene.add(ocean.mesh);
	const reflection = low ? null : makeReflection(0.5);
	if (reflection) ocean.mat.uniforms.uRefl.value = reflection.rt.texture;
	const flow = new THREE.Vector2(); // how far the sea has streamed past the ship

	const moonLight = new THREE.DirectionalLight('#d9e2ff', 2.0);
	moonLight.position.copy(MOON_POS).normalize().multiplyScalar(50);
	scene.add(moonLight);
	const fill = new THREE.DirectionalLight('#ffcf98', 0.9);
	fill.position.set(-20, 8, 30);
	scene.add(fill);
	const rim = new THREE.DirectionalLight('#5ad6c9', 0.25);
	rim.position.set(30, 6, 25);
	scene.add(rim);
	scene.add(new THREE.HemisphereLight('#41598a', '#04070d', 1.1));

	/* the ship, on a steady anchor so camera shots can be framed in ship space */
	const anchor = new THREE.Group();
	anchor.position.set(10.5, 0, -11);
	anchor.rotation.y = -0.32;
	scene.add(anchor);
	const g = makeGalleon();
	const ship = g.ship;
	anchor.add(ship);
	ocean.mesh.position.set(anchor.position.x, 0, anchor.position.z);
	const bowDir = new THREE.Vector2(Math.cos(-anchor.rotation.y), Math.sin(-anchor.rotation.y));
	const spray = makeSpray(low ? 260 : 700);
	spray.mat.uniforms.uPx.value = dpr;
	ship.add(spray.points);

	/* story props */
	const mats = makeMaterials();
	const helm = makeWheel(mats);
	helm.root.position.set(-4.3, 1.28, 0);
	helm.root.rotation.y = Math.PI; // wheel faces aft, toward the captain
	ship.add(helm.root);
	const captain = makeCaptain(mats);
	captain.root.position.set(-5.05, 1.28, 0);
	ship.add(captain.root);
	// warm lantern key on the captain's face for the About close-up (from frame left)
	const faceKey = new THREE.PointLight('#ffbf80', 0, 4.5, 1.6);
	faceKey.position.set(-3.9, 3.35, 0.55);
	ship.add(faceKey);
	const table = makeChartTable(mats, opts.destinations ?? []);
	table.root.position.set(-1.95, 0.5, 0);
	ship.add(table.root);

	/* project islands that rise out of the chart, one at a time, as each project comes into view */
	const pinMats = {
		sand: new THREE.MeshStandardMaterial({ color: '#c9a76b', roughness: 0.9 }),
		hill: new THREE.MeshStandardMaterial({ color: '#4f6b3a', roughness: 0.85 }),
		pole: new THREE.MeshStandardMaterial({ color: '#3b2817', roughness: 0.8 }),
		flag: new THREE.MeshBasicMaterial({ color: '#5ad6c9', side: THREE.DoubleSide, toneMapped: false }),
		beam: new THREE.MeshBasicMaterial({ color: '#5ad6c9', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
		ring: new THREE.MeshBasicMaterial({ color: '#f3c46b', transparent: true, opacity: 0.8, toneMapped: false })
	};
	const pins = (opts.destinations ?? []).slice(0, MAP_SPOTS.length).map((_, i) => {
		const g = new THREE.Group();
		g.position.copy(table.spotToLocal(MAP_SPOTS[i][0], MAP_SPOTS[i][1]));
		const isle = new THREE.Group();
		const base = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.022, 10), pinMats.sand);
		base.position.y = 0.011;
		const hill = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.05, 8), pinMats.hill);
		hill.position.set(-0.008, 0.045, 0.004);
		const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.11, 6), pinMats.pole);
		pole.position.set(0.018, 0.075, -0.01);
		const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.024), pinMats.flag);
		flag.position.set(0.039, 0.115, -0.01);
		isle.add(base, hill, pole, flag);
		const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.42, 16, 1, true), pinMats.beam);
		beam.position.y = 0.21;
		const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.003, 6, 40), pinMats.ring.clone());
		ring.rotation.x = Math.PI / 2;
		ring.position.y = 0.004;
		g.add(isle, beam, ring);
		g.visible = false;
		table.root.add(g);
		return { g, isle, beam, ring, flag, pop: 0 };
	});
	const pinLight = new THREE.PointLight('#7fe6da', 0, 0.9, 1.5);
	table.root.add(pinLight);
	g.robot.group.position.set(-1.95, 0.5, -0.82);
	g.robot.group.rotation.y = 0;
	const chest = makeChest(mats);
	chest.root.position.set(4.15, 0.6, 0.15);
	chest.root.rotation.y = 0.5;
	ship.add(chest.root);
	const isle = makeSignalIsle();
	isle.root.position.copy(ISLE_POS);

	/* Experience: ports of call on the starboard side, passed one at a time */
	const PORT_GAP = 30;
	const PORT_X = 15; // where the current port sits: off the starboard bow
	const portList = (opts.ports ?? []).map((p, i) => {
		const port = makePort(p.kind, i + 1);
		port.root.position.set(PORT_X + i * PORT_GAP, 0, 8 + (i % 2) * 2.5);
		port.root.scale.setScalar(0.62);
		port.root.rotation.y = i * 1.3;
		anchor.add(port.root);
		return { ...port, lit: 0 };
	});
	let portPos = 0;
	anchor.add(isle.root);

	/* post-processing (desktop / capable devices only) */
	let composer = null;
	let film = null;
	let bloom = null;
	if (!low) {
		composer = new EffectComposer(renderer);
		composer.setPixelRatio(dpr);
		composer.addPass(new RenderPass(scene, camera));
		bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.55, 0.78);
		composer.addPass(bloom);
		film = new ShaderPass(FilmShader);
		composer.addPass(film);
		composer.addPass(new OutputPass());
	}

	/* camera keys: the opening shots are authored in world space, the rest in anchor space */
	anchor.updateMatrixWorld(true);
	const toLocal = (v) => anchor.worldToLocal(new THREE.Vector3(...v));
	const heroKey = { t: 0, pos: toLocal([-2, 2.4, 19]), look: toLocal([6.5, 5.2, -9]), follow: 0, offset: 0 };
	const introKey = { pos: toLocal([-16, 0.9, 46]), look: toLocal([6, 3.4, -9]) };
	const keys = [
		heroKey,
		...STAGE_KEYS.map((k) => ({ ...k, pos: new THREE.Vector3(...k.pos), look: new THREE.Vector3(...k.look) }))
	];

	/* state */
	let target = 0; // timeline from the page
	let tl = 0; // smoothed timeline
	const focus = { skill: 0, project: -1, projectsFrac: 0, port: -1 };
	let intro = opts.intro ? 0 : 1;
	let introPlaying = false;
	let px = 0,
		py = 0,
		pxs = 0,
		pys = 0;
	let raf = 0,
		running = false,
		last = performance.now(),
		time = 0,
		lastInput = performance.now(),
		frameNo = 0;
	let narrow = false,
		vw = 1,
		vh = 1;
	let wheelAngle = 0,
		needleAngle = 0,
		lidOpen = 0,
		beaconLit = 0;
	let haze = 0;
	let shipBow = 0,
		sprayPower = 0;
	const camPos = new THREE.Vector3(),
		camLook = new THREE.Vector3(),
		tmpA = new THREE.Vector3(),
		tmpB = new THREE.Vector3(),
		lanternWorld = new THREE.Vector3(),
		beaconWorld = new THREE.Vector3();
	const handL = new THREE.Vector3(),
		handR = new THREE.Vector3(),
		restL = new THREE.Vector3(),
		restR = new THREE.Vector3(),
		saluteHand = new THREE.Vector3(),
		saluteElbow = new THREE.Vector3(0.05, 1.47, 0.46);
	let saluteT = -1;
	let pinFocus = 0;
	const pinShip = new THREE.Vector3(),
		tmpPin = new THREE.Vector3(),
		pinScreen = new THREE.Vector3();

	function sample(t) {
		let i = 0;
		while (i < keys.length - 2 && t > keys[i + 1].t) i++;
		const a = keys[i],
			b = keys[i + 1];
		const e = smooth(0, 1, (t - a.t) / (b.t - a.t));
		return {
			pos: tmpA.lerpVectors(a.pos, b.pos, e),
			look: tmpB.lerpVectors(a.look, b.look, e),
			follow: a.follow + (b.follow - a.follow) * e,
			offset: a.offset + (b.offset - a.offset) * e
		};
	}

	function resize() {
		vw = canvas.clientWidth || window.innerWidth;
		vh = canvas.clientHeight || window.innerHeight;
		renderer.setSize(vw, vh, false);
		reflection?.setSize(vw * dpr, vh * dpr);
		composer?.setSize(vw, vh);
		film?.uniforms.uRes.value.set(vw * dpr, vh * dpr);
		camera.aspect = vw / vh;
		narrow = vw / vh < 0.9;
		camera.fov = narrow ? 50 : 34;
		camera.updateProjectionMatrix();
	}

	let skipRender = false;
	function frame(dt, realDt = dt) {
		time += dt;
		// story smoothing runs on real elapsed time so slow devices don't lag a stage behind
		const k = 1 - Math.exp(-realDt * 3.2);
		tl += (target - tl) * k;
		pxs += (px - pxs) * Math.min(1, dt * 2.5);
		pys += (py - pys) * Math.min(1, dt * 2.5);
		if (introPlaying) {
			intro = Math.min(1, intro + realDt / 3.4);
			if (intro >= 1) {
				introPlaying = false;
				opts.onIntroEnd?.();
			}
		}

		ocean.mat.uniforms.uTime.value = time;
		sky.mat.uniforms.uTime.value = time;
		stars.mat.uniforms.uTime.value = time;
		fog.mat.uniforms.uTime.value = time;
		if (film) film.uniforms.uTime.value = time;

		// stage weights
		const deck = smooth(0.4, 1, tl) * (1 - smooth(3.3, 3.85, tl)); // close-up deck shots (experience is filmed from the water)
		const atTable = Math.max(0, 1 - Math.abs(tl - 3) / 1.6);

		// the sea streams past the hull: the ship is under way
		flow.x += bowDir.x * SAIL_SPEED * dt;
		flow.y += bowDir.y * SAIL_SPEED * dt;
		ocean.mat.uniforms.uFlow.value.copy(flow);

		// buoyancy: heave, pitch and roll come from the same surface the ocean draws,
		// averaged over the hull's footprint (a 12 m hull ignores the short chop)
		const wx = anchor.position.x,
			wz = anchor.position.z;
		const bx = bowDir.x,
			bz = bowDir.y;
		const H = (along, across) => waveHeight(wx + bx * along - bz * across, wz + bz * along + bx * across, time, flow);
		const hBow = (H(4.6, 0) + H(3.4, 0.9) + H(3.4, -0.9)) / 3;
		const hStern = (H(-4.6, 0) + H(-3.4, 1.2) + H(-3.4, -1.2)) / 3;
		const hPort = (H(1.5, -1.5) + H(-1.5, -1.5)) / 2;
		const hStar = (H(1.5, 1.5) + H(-1.5, 1.5)) / 2;
		const hMid = (hBow + hStern + hPort + hStar + H(0, 0)) / 5;
		const kk = 1 - Math.exp(-dt * 4);
		const prevBow = shipBow;
		ship.position.y += (hMid + 0.04 - ship.position.y) * kk;
		ship.rotation.z += (Math.atan2(hBow - hStern, 9.2) - ship.rotation.z) * kk;
		ship.rotation.x += (Math.atan2(hPort - hStar, 3.0) * 0.85 - ship.rotation.x) * kk;
		// bow height relative to the water just ahead: plunging throws spray
		shipBow = ship.position.y + Math.sin(ship.rotation.z) * 5.5 - H(5.6, 0);
		const plunge = dt > 0 ? (prevBow - shipBow) / dt : 0;
		sprayPower += (Math.min(1, 0.35 + Math.max(0, plunge) * 1.6 + Math.max(0, -shipBow) * 0.8) - sprayPower) * Math.min(1, dt * 3);
		spray.mat.uniforms.uTime.value = time;
		spray.mat.uniforms.uPower.value = sprayPower;
		ship.updateMatrixWorld();
		ocean.mat.uniforms.uShipPos.value.setFromMatrixPosition(ship.matrixWorld);
		ocean.mat.uniforms.uShipDir.value.copy(bowDir);
		ocean.mat.uniforms.uWake.value = 1;

		// canvas, pennant
		for (let i = 0; i < g.sails.length; i++) g.sails[i].scale.x = 1 + Math.sin(time * 1.1 + i * 0.7) * 0.1;
		const fp = g.pennant.geometry.attributes.position;
		for (let i = 0; i < fp.count; i++) {
			const x = fp.getX(i);
			fp.setZ(i, Math.sin(time * 5 - x * 3.2) * 0.12 * x);
		}
		fp.needsUpdate = true;

		// the wheel turns as the voyage moves between sections; the captain steers
		const wheelTarget = tl * 1.25 + Math.sin(time * 0.5) * 0.06;
		wheelAngle += (wheelTarget - wheelAngle) * Math.min(1, dt * 2);
		helm.wheel.rotation.x = wheelAngle;
		const sway = Math.sin(wheelAngle) * 0.05;

		// About: the captain lets go of the wheel, turns to camera, salutes, and goes back to steering.
		// It plays once each time the About shot is reached.
		const atAbout = Math.abs(tl - 1) < 0.12 && Math.abs(target - 1) < 0.2;
		if (atAbout && saluteT < 0) saluteT = 0;
		if (Math.abs(tl - 1) > 0.55) saluteT = -1; // re-arm once we've left the shot
		if (saluteT >= 0) saluteT += realDt;
		const st = Math.max(saluteT, 0);
		// phases (s): 0–0.9 turn · 0.9–1.5 hand up · 1.5–3.3 hold · 3.3–3.9 hand down · 3.9–5.0 back to the wheel
		const turnW = saluteT < 0 ? 0 : smooth(0, 0.9, st) * (1 - smooth(3.9, 5.0, st));
		const armW = saluteT < 0 ? 0 : smooth(0.9, 1.5, st) * (1 - smooth(3.3, 3.9, st));
		const release = saluteT < 0 ? 0 : smooth(0.0, 0.5, st) * (1 - smooth(4.3, 5.0, st));
		const yaw = -0.86 * turnW;
		captain.root.rotation.y = yaw;
		// wheel grips (ship space), expressed in the turned captain's local space
		const toLocal = (x, y, z, out) => {
			out.set(x, y, z);
			const c = Math.cos(-yaw),
				sn = Math.sin(-yaw);
			return out.set(out.x * c + out.z * sn, out.y, -out.x * sn + out.z * c);
		};
		toLocal(0.45, 1.2 + sway, -0.3, handL);
		toLocal(0.45, 1.2 - sway, 0.3, handR);
		// hands drop to the sides on letting go; the right hand rises to the hat brim
		restL.set(0.06, 0.92, -0.27);
		restR.set(0.08, 0.95, 0.28);
		handL.lerp(restL, release);
		handR.lerp(restR, release * (1 - armW));
		saluteHand.set(0.11, 1.75, 0.12);
		handR.lerp(saluteHand, armW);
		captain.reach([handL, handR], [null, saluteElbow], [0, armW]);
		// head: the usual look-around, then straight down the lens (and a small nod) during the salute
		captain.head.rotation.y = (Math.sin(time * 0.3) * 0.12 + smooth(0.6, 1, tl) * (1 - smooth(1.2, 1.8, tl)) * 0.2) * (1 - turnW) - 0.06 * turnW;
		captain.head.rotation.z = Math.sin(time * 0.45) * 0.03 * (1 - armW) - 0.06 * armW * Math.max(0, Math.sin(Math.min(1, (st - 1.4) / 0.5) * Math.PI));
		captain.coatMesh.rotation.y = Math.sin(time * 1.3) * 0.02;
		faceKey.intensity = Math.max(0, 1 - Math.abs(tl - 1) / 0.6) * (3.2 + Math.sin(time * 7) * 0.25);

		// robot navigator: works the chart, looks up at the camera on its stage
		g.robot.armR.rotation.z = -1.1 + Math.sin(time * 3) * 0.35 * (1 - atTable * 0.7);
		g.robot.group.rotation.y = Math.sin(time * 0.4) * 0.12 + atTable * 0.25;
		g.robot.tip.visible = Math.sin(time * 4) > -0.6;
		g.robot.term.update(time);

		// compass: points at the skill category, then the active destination
		let needleTarget = Math.sin(time * 0.7) * 0.08;
		if (tl > 1.5 && tl < 2.6) needleTarget = focus.skill * (Math.PI / 2) + 0.4;
		else if (tl >= 2.6 && tl < 3.8 && focus.project >= 0) needleTarget = -0.8 + focus.project * 0.55;
		needleAngle += (needleTarget - needleAngle) * Math.min(1, dt * 3);
		table.needle.rotation.y = -needleAngle + Math.sin(time * 6) * 0.01;

		// the chart: route reveals through the projects section, active island pulses
		const reveal = Math.min(1, smooth(2.4, 3, tl) * 0.18 + focus.projectsFrac * 0.92);
		table.map.draw(reveal, tl > 2.5 && tl < 3.8 ? focus.project : -1, (time * 0.8) % 1);
		const atProjects = Math.max(0, 1 - Math.abs(tl - 3) / 0.45);
		let activePin = null;
		for (let i = 0; i < pins.length; i++) {
			const pin = pins[i];
			const want = i === focus.project && atProjects > 0.5 ? 1 : 0;
			pin.pop += (want - pin.pop) * Math.min(1, dt * (want ? 3.2 : 5));
			const e = pin.pop;
			pin.g.visible = e > 0.01;
			if (!pin.g.visible) continue;
			// rise out of the paper with a little overshoot
			const back = 1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2);
			pin.isle.scale.set(Math.max(0.001, back), Math.max(0.001, back), Math.max(0.001, back));
			pin.beam.scale.set(1, Math.max(0.001, e), 1);
			pin.beam.material.opacity = 0.14 * e * (0.8 + 0.2 * Math.sin(time * 5));
			const rp = (time * 0.9) % 1;
			pin.ring.scale.setScalar(0.5 + rp * 1.4);
			pin.ring.material.opacity = (1 - rp) * 0.8 * e;
			pin.flag.rotation.y = Math.sin(time * 6) * 0.25;
			if (want) activePin = pin;
		}
		if (activePin) pinLight.position.copy(activePin.g.position).add(tmpPin.set(0, 0.12, 0));
		pinLight.intensity += ((activePin ? 0.18 : 0) - pinLight.intensity) * Math.min(1, dt * 4);
		pinFocus += ((activePin ? 1 : 0) * atProjects - pinFocus) * Math.min(1, dt * 2.2);
		if (activePin) {
			// pin position in ship space, for the camera and the page
			pinShip.copy(activePin.g.position);
			table.root.localToWorld(pinShip);
			ship.worldToLocal(pinShip);
		}

		// lanterns
		const tableGlow = Math.max(smooth(1.2, 2, tl) * (1 - smooth(4.3, 4.9, tl)), 0);
		table.light.intensity = tableGlow * (1.8 + Math.sin(time * 9) * 0.15);
		table.flame.scale.y = 1.5 + Math.sin(time * 11) * 0.15;
		g.lanternLight.intensity = (8.5 - deck * 4) + Math.sin(time * 7) * 0.6 + Math.sin(time * 13) * 0.35;
		g.lanternLight.getWorldPosition(lanternWorld);
		ocean.mat.uniforms.uLantern.value.copy(lanternWorld);

		// finale: the chest opens and the beacon on Signal Isle ignites
		const finale = smooth(4.35, 4.95, tl);
		lidOpen += (finale - lidOpen) * Math.min(1, dt * 2.5);
		chest.hinge.rotation.x = -lidOpen * 1.9;
		chest.light.intensity = lidOpen * (2.2 + Math.sin(time * 6) * 0.3);
		chest.crystal.rotation.y = time * 0.8;
		beaconLit += (finale - beaconLit) * Math.min(1, dt * 1.5);
		isle.update(beaconLit, time);

		// the ports glide past the starboard side as the log moves from one entry to the next
		const atExp = Math.max(0, 1 - Math.abs(tl - 4) / 0.7);
		const portTarget = focus.port >= 0 ? focus.port : tl < 4 ? -0.6 : portList.length - 0.4;
		portPos += (portTarget - portPos) * Math.min(1, dt * 1.6);
		for (let i = 0; i < portList.length; i++) {
			const pt = portList[i];
			pt.root.position.x = PORT_X + (i - portPos) * PORT_GAP;
			pt.root.visible = atExp > 0.01 && i - portPos > -1.05 && i - portPos < 3.2;
			const want = atExp > 0.3 && Math.abs(i - portPos) < 0.5 ? 1 : 0;
			pt.lit += (want - pt.lit) * Math.min(1, dt * 2);
			if (pt.root.visible) pt.update(pt.lit, time + i);
		}
		isle.light.getWorldPosition(beaconWorld);
		ocean.mat.uniforms.uBeacon.value.copy(beaconWorld);
		ocean.mat.uniforms.uBeaconI.value = beaconLit;

		renderer.toneMappingExposure = 1.15 + deck * 0.05;
		// close-ups sit next to lanterns: soften the bloom so they don't flare
		if (bloom) {
			bloom.strength = 0.7 - deck * 0.35;
			bloom.threshold = 0.78 + deck * 0.12;
		}

		// haze peaks between stages: a fog dissolve, applied by the page as an overlay
		const frac = tl - Math.floor(tl);
		haze = tl > 0.6 && tl < 4.95 ? Math.pow(Math.sin(Math.PI * frac), 2) * Math.min(1, Math.abs(target - tl) * 3) : 0;
		opts.onFrame?.(haze);

		// camera
		const s = sample(tl);
		const lp = s.pos.clone();
		const ll = s.look.clone();
		if (pinFocus > 0.001) {
			// lean in over the chart toward the island that just rose
			const shift = tmpPin.copy(pinShip).sub(ll).multiplyScalar(0.8 * pinFocus);
			ll.add(shift);
			lp.add(shift);
			lp.lerp(ll, 0.22 * pinFocus);
		}
		if (narrow) {
			// portrait: tilt so the subject sits above the text, and step back a little
			const heroW = 1 - smooth(0, 1, tl);
			const drop = Math.min(11, (vh / vw - 1) * 6) * heroW;
			ll.y -= drop * 0.35;
			const pull = 1 + 0.45 * heroW + 0.35 * (1 - heroW);
			lp.sub(ll).multiplyScalar(pull).add(ll);
			// the experience voyage on a phone: keep the ship and the lit port in the window above the log card
			const expW = Math.max(0, 1 - Math.abs(tl - 4) / 0.6);
			ll.x += 7 * expW;
			ll.z += 2.5 * expW;
			lp.add(tmpPin.set(-4, 1.2, 3).multiplyScalar(expW)); // step back to fit ship and port
			ll.y -= 4.2 * expW;
		}
		// opening fly-in from the water
		if (intro < 1) {
			const e = smooth(0, 1, intro);
			lp.lerpVectors(introKey.pos, lp, e);
			ll.lerpVectors(introKey.look, ll, e);
		}
		const pa = anchor.localToWorld(lp.clone());
		const pb = ship.localToWorld(lp.clone());
		const la = anchor.localToWorld(ll.clone());
		const lb = ship.localToWorld(ll.clone());
		camPos.lerpVectors(pa, pb, s.follow);
		camLook.lerpVectors(la, lb, s.follow);
		const drift = 1 - deck * 0.7;
		camera.position.set(
			camPos.x + (pxs * 0.8 + Math.sin(time * 0.21) * 0.15) * drift,
			camPos.y + (pys * 0.35 + Math.sin(time * 0.33) * 0.06) * drift + (1 - s.follow) * waveHeight(camPos.x, camPos.z, time, flow) * 0.15,
			camPos.z
		);
		camera.lookAt(camLook);
		const off = narrow ? 0 : s.offset;
		if (Math.abs(off) > 0.005) camera.setViewOffset(vw, vh, -off * vw, 0, vw, vh);
		else if (camera.view) camera.clearViewOffset();

		// where the active island sits on screen, so its card can grow out of it
		if (opts.onPin) {
			camera.updateMatrixWorld();
			pinScreen.copy(pinShip);
			ship.localToWorld(pinScreen);
			pinScreen.project(camera);
			opts.onPin((pinScreen.x * 0.5 + 0.5) * vw, (0.5 - pinScreen.y * 0.5) * vh, pinFocus);
		}
		// keep the camera above the water on low shots
		const surf = waveHeight(camera.position.x, camera.position.z, time, flow);
		if (camera.position.y < surf + 0.35) camera.position.y = surf + 0.35;
		camera.lookAt(camLook);
		if (skipRender) return;
		if (reflection) reflection.render(renderer, scene, camera, [ocean.mesh, spray.points, fog.group]);
		if (reflection) ocean.mat.uniforms.uReflMat.value.copy(reflection.texMat);
		if (composer) composer.render(dt);
		else renderer.render(scene, camera);
	}

	function loop(now) {
		raf = requestAnimationFrame(loop);
		// rAF timestamps can predate `last` on a slow first frame: never step backwards
		const real = Math.min(Math.max((now - last) / 1000, 0), 0.25);
		const dt = Math.min(real, 0.05);
		// when nobody is scrolling or moving the pointer, drop to ~30 fps
		const idle = now - lastInput > 4000 && !introPlaying && Math.abs(target - tl) < 0.002;
		frameNo++;
		if (idle && frameNo % 2) return;
		last = now;
		frame(dt, real);
	}

	resize();
	for (let i = 0; i < 40; i++) {
		time += 0.05;
		ship.position.y = waveHeight(anchor.position.x, anchor.position.z, time, flow) + 0.04;
	}

	return {
		renderStill() {
			frame(0.016);
		},
		/** Simulate `seconds` of scene time in fixed steps, then draw one frame (used by tests). */
		advance(seconds) {
			skipRender = true;
			for (let t = 0; t < seconds; t += 1 / 30) frame(1 / 30);
			skipRender = false;
			frame(0.001);
		},
		start() {
			if (running) return;
			running = true;
			if (intro < 1 && !introPlaying) introPlaying = true;
			last = performance.now();
			raf = requestAnimationFrame(loop);
		},
		stop() {
			running = false;
			introPlaying = false;
			cancelAnimationFrame(raf);
		},
		get running() {
			return running;
		},
		get introDone() {
			return intro >= 1;
		},
		get haze() {
			return haze;
		},
		/** current (smoothed) story position, 0..5 */
		get timeline() {
			return tl;
		},
		skipIntro() {
			if (intro >= 1) return;
			intro = 1;
			introPlaying = false;
			opts.onIntroEnd?.();
		},
		/** @param {number} t 0..5 position in the story */
		setTimeline(t, instant = false) {
			target = t;
			lastInput = performance.now();
			if (instant || !running) tl = t;
		},
		/** @param {{skill?: number, project?: number, projectsFrac?: number, port?: number}} f */
		setFocus(f) {
			Object.assign(focus, f);
			lastInput = performance.now();
		},
		setPointer(x, y) {
			px = x;
			py = y;
			lastInput = performance.now();
		},
		resize,
		dispose() {
			this.stop();
			scene.traverse((o) => {
				if (o.geometry) o.geometry.dispose();
				if (o.material) {
					const ms = Array.isArray(o.material) ? o.material : [o.material];
					for (const m of ms) {
						for (const key of ['map', 'alphaMap']) m[key]?.dispose?.();
						m.dispose();
					}
				}
			});
			composer?.dispose?.();
			reflection?.dispose();
			renderer.dispose();
		}
	};
}
