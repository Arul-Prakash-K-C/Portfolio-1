// @ts-nocheck — three ships no bundled types; this file is checked by running it.
/**
 * The captain: a skinned, rigged 3D character (static/models/captain.glb,
 * generated from Arul's reference sheets and rigged with a 19-bone humanoid
 * skeleton). Everything is posed procedurally:
 *
 *   - two-bone IK for arms and legs; arm IK aims the palm (not the wrist),
 *   - props are children of the hand bones at a measured palm socket, so a
 *     grip can never drift from the hand,
 *   - feet stay planted on the deck and take real steps (lift, arc, place)
 *     when the stance changes; hips shift weight onto the support foot and
 *     the shoulders counter-rotate against the hips,
 *   - every pose channel is critically damped (~0.25 s), so nothing snaps,
 *   - blades are kept out of the body and away from the face and hat.
 *
 * Captain space (the group returned as `root`): +x faces the wheel, +y up,
 * +z is the captain's right-hand side, feet at y = 0.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const smooth = (x) => {
	const t = clamp(x, 0, 1);
	return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------------ */
/* Props: every prop is built with its grip at the origin and its      */
/* working axis (blade tip / muzzle) along +Y; +X is the edge side.    */
/* ------------------------------------------------------------------ */
function cutlassBlade() {
	// 66 cm curved blade, wedge section: thick back (6 mm) to a fine edge, tapering to the point
	const L = 0.66,
		N = 40;
	const pos = [];
	const idx = [];
	for (let i = 0; i <= N; i++) {
		const s = i / N;
		const y = s * L;
		const curve = -0.055 * s * s; // the back curves away from the edge
		const w = s < 0.82 ? 0.034 - 0.006 * s : 0.029 * Math.sqrt(Math.max(0, (1 - s) / 0.18));
		const t = 0.006 * (1 - 0.5 * s);
		const backX = curve - w * 0.45,
			edgeX = curve + w * 0.55;
		// back-left, back-right, edge
		pos.push(backX, y, t / 2, backX, y, -t / 2, edgeX, y + (s > 0.82 ? 0 : 0), 0);
	}
	for (let i = 0; i < N; i++) {
		const a = i * 3,
			b = (i + 1) * 3;
		idx.push(a, b, a + 2, b, b + 2, a + 2); // +z face
		idx.push(a + 1, a + 2, b + 1, b + 1, a + 2, b + 2); // -z face
		idx.push(a, a + 1, b, b, a + 1, b + 1); // back
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
}

function makeProps() {
	const wood = new THREE.MeshStandardMaterial({ color: '#4a2a14', roughness: 0.5 });
	const leather = new THREE.MeshStandardMaterial({ color: '#2b1a10', roughness: 0.7 });
	const iron = new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: 0.85, roughness: 0.35 });
	const brass = new THREE.MeshStandardMaterial({ color: '#b98536', metalness: 0.9, roughness: 0.32 });
	const steel = new THREE.MeshStandardMaterial({ color: '#aeb3bb', metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide });

	// cutlass, 80 cm overall: 11 cm grip, brass knuckle-bow guard, 66 cm blade
	const cutlass = new THREE.Group();
	const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.11, 10), leather);
	const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), brass);
	pommel.position.y = -0.062;
	const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.012, 16), brass);
	cup.position.y = 0.061;
	const bowCurve = new THREE.CatmullRomCurve3([V(0, -0.058, 0), V(0.045, -0.04, 0), V(0.058, 0.01, 0), V(0.04, 0.06, 0)]);
	const bow = new THREE.Mesh(new THREE.TubeGeometry(bowCurve, 16, 0.005, 6), brass);
	const blade = new THREE.Mesh(cutlassBlade(), steel);
	blade.position.y = 0.066;
	cutlass.add(grip, pommel, cup, bow, blade);

	// flintlock pistol, ~40 cm: butt below the hand, 24 cm barrel along +Y
	const pistol = new THREE.Group();
	const stockCurve = new THREE.CatmullRomCurve3([V(-0.02, -0.07, 0), V(0, -0.02, 0), V(0.012, 0.04, 0), V(0.012, 0.16, 0)]);
	const stock = new THREE.Mesh(new THREE.TubeGeometry(stockCurve, 16, 0.017, 8), wood);
	const butt = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), brass);
	butt.position.set(-0.022, -0.078, 0);
	const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.24, 12), iron);
	barrel.position.set(0.016, 0.16, 0);
	const lock = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.03), brass);
	lock.position.set(0.012, 0.035, 0);
	const guardP = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 6, 12, Math.PI), brass);
	guardP.position.set(-0.012, 0.03, 0);
	guardP.rotation.z = Math.PI / 2;
	pistol.add(stock, butt, barrel, lock, guardP);
	const muzzle = new THREE.Object3D();
	muzzle.position.set(0.016, 0.285, 0);
	pistol.add(muzzle);

	// sea chart: a sheet that unrolls between the hands (placed in captain space)
	const chartMat = new THREE.MeshStandardMaterial({ map: chartTexture(), roughness: 0.9, side: THREE.DoubleSide });
	const chart = new THREE.Group();
	const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.34, 12, 1), chartMat);
	chart.add(sheet);
	const rollMat = new THREE.MeshStandardMaterial({ color: '#d8c49a', roughness: 0.9 });
	const rollL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.36, 10), rollMat);
	const rollR = rollL.clone();
	chart.add(rollL, rollR);

	// muzzle flash, light and smoke
	const flash = new THREE.Mesh(
		new THREE.SphereGeometry(0.05, 12, 8),
		new THREE.MeshBasicMaterial({ color: '#ffd28a', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })
	);
	const smoke = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTexture(), color: '#b9bec6', transparent: true, opacity: 0, depthWrite: false }));
	const flashLight = new THREE.PointLight('#ffb35a', 0, 6, 1.6);
	return { cutlass, pistol, muzzle, chart, sheet, rollL, rollR, flash, smoke, flashLight };
}

function puffTexture() {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d');
	for (let i = 0; i < 14; i++) {
		const x = 64 + (Math.random() - 0.5) * 50,
			y = 64 + (Math.random() - 0.5) * 50,
			r = 18 + Math.random() * 26;
		const grd = g.createRadialGradient(x, y, 0, x, y, r);
		grd.addColorStop(0, 'rgba(255,255,255,0.35)');
		grd.addColorStop(1, 'rgba(255,255,255,0)');
		g.fillStyle = grd;
		g.fillRect(0, 0, 128, 128);
	}
	return new THREE.CanvasTexture(c);
}

function chartTexture() {
	const c = document.createElement('canvas');
	c.width = 512;
	c.height = 176;
	const g = c.getContext('2d');
	const grd = g.createLinearGradient(0, 0, 512, 176);
	grd.addColorStop(0, '#efdfb6');
	grd.addColorStop(1, '#d4bb86');
	g.fillStyle = grd;
	g.fillRect(0, 0, 512, 176);
	g.strokeStyle = 'rgba(90,60,25,.5)';
	g.lineWidth = 2;
	for (const [x, y, r] of [
		[120, 90, 34],
		[300, 60, 24],
		[400, 120, 30]
	]) {
		g.beginPath();
		g.ellipse(x, y, r * 1.3, r, 0.3, 0, Math.PI * 2);
		g.stroke();
	}
	g.setLineDash([8, 7]);
	g.strokeStyle = '#7d2614';
	g.beginPath();
	g.moveTo(120, 90);
	g.quadraticCurveTo(220, 20, 300, 60);
	g.quadraticCurveTo(360, 100, 400, 120);
	g.stroke();
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

/* ------------------------------------------------------------------ */
/* Keyframed actions (body space: +x forward, +z right)                */
/* ------------------------------------------------------------------ */
// R/L = palm targets · eR/eL = elbow pole hints · aR = direction of the item in the
// right hand (blade tip / muzzle) · yaw = body turn (negative turns toward +z) ·
// at = 0 at the wheel … 1 on the About mark · lean/drop/twist = torso ·
// head = [yaw, pitch] · step = right foot forward (lunge) · prop = item in hand ·
// chart = 0..1 unrolled. Every transition is at least 0.25 s.
const HOLSTER_R = [0.13, 0.97, -0.13]; // pistol / cutlass hilt at the left front hip (cross draw)
const HANG_R = [0.06, 0.86, 0.27],
	HANG_L = [0.06, 0.86, -0.27];
const STEER = {
	R: [0.43, 1.22, 0.32],
	L: [0.43, 1.22, -0.32],
	eR: [-0.2, -1, 0.7],
	eL: [-0.2, -1, -0.7],
	aR: [0, -1, 0.2],
	yaw: 0,
	at: 0,
	lean: 0.06,
	drop: 0,
	twist: 0,
	head: [0, 0],
	step: 0,
	prop: 'none',
	chart: 0,
	wheel: 1
};
const ABOUT = { yaw: -0.6, at: 1, wheel: 0, lean: 0.02 };

const ACTIONS = [
	{
		name: 'fire', // draw, aim, fire, recover, holster
		keys: [
			{ t: 0, ...STEER },
			{ t: 0.55, ...ABOUT, R: HANG_R, L: HANG_L, eR: [-0.2, -1, 0.6], head: [0, 0.05] },
			{ t: 1.0, ...ABOUT, R: HOLSTER_R, L: HANG_L, aR: [0.2, -1, 0.3], eR: [0, -1, 1], head: [0.1, 0.12], twist: 0.12 },
			{ t: 1.3, ...ABOUT, R: [0.28, 1.22, 0.16], L: HANG_L, aR: [0.6, 0.6, 0.2], eR: [0, -1, 1], prop: 'pistol', twist: 0.05 },
			{ t: 1.75, ...ABOUT, R: [0.5, 1.46, 0.5], L: [-0.02, 0.96, -0.3], aR: [0.95, 0.04, 0.32], eR: [0, -0.5, 1], prop: 'pistol', twist: 0.22, head: [0.18, 0.02], drop: 0.03 },
			{ t: 2.1, ...ABOUT, R: [0.5, 1.46, 0.5], L: [-0.02, 0.96, -0.3], aR: [0.95, 0.04, 0.32], eR: [0, -0.5, 1], prop: 'pistol', twist: 0.22, head: [0.18, 0.02], drop: 0.03, fire: 1 },
			{ t: 2.35, ...ABOUT, R: [0.45, 1.56, 0.47], L: [-0.02, 0.96, -0.3], aR: [0.8, 0.5, 0.3], eR: [0, -0.5, 1], prop: 'pistol', twist: 0.18, head: [0.18, -0.02], lean: -0.03, drop: 0.03 },
			{ t: 2.9, ...ABOUT, R: [0.5, 1.45, 0.48], L: [-0.02, 0.96, -0.3], aR: [0.95, 0.04, 0.32], eR: [0, -0.5, 1], prop: 'pistol', twist: 0.2, head: [0.18, 0.02], drop: 0.03 },
			{ t: 3.5, ...ABOUT, R: [0.28, 1.12, 0.12], L: HANG_L, aR: [0.5, -0.8, 0.1], eR: [0, -1, 1], prop: 'pistol' },
			{ t: 3.9, ...ABOUT, R: HOLSTER_R, L: HANG_L, aR: [0.2, -1, 0.3], eR: [0, -1, 1], prop: 'pistol', head: [0.05, 0.1] },
			{ t: 4.2, ...ABOUT, R: HANG_R, L: HANG_L }
		]
	},
	{
		name: 'chart', // take the chart from the coat, unroll, read, roll up
		keys: [
			{ t: 0, ...ABOUT, R: HANG_R, L: HANG_L },
			{ t: 0.55, ...ABOUT, R: [0.3, 1.18, 0.05], L: [0.3, 1.18, -0.05], eR: [-0.3, -1, 0.8], eL: [-0.3, -1, -0.8], head: [0, 0.35], prop: 'chart', chart: 0 },
			{ t: 1.3, ...ABOUT, R: [0.36, 1.2, 0.24], L: [0.36, 1.2, -0.24], eR: [-0.3, -1, 0.8], eL: [-0.3, -1, -0.8], head: [0, 0.45], lean: 0.1, prop: 'chart', chart: 1 },
			{ t: 2.4, ...ABOUT, R: [0.36, 1.21, 0.25], L: [0.36, 1.19, -0.23], eR: [-0.3, -1, 0.8], eL: [-0.3, -1, -0.8], head: [-0.12, 0.42], lean: 0.1, prop: 'chart', chart: 1 },
			{ t: 3.4, ...ABOUT, R: [0.36, 1.2, 0.24], L: [0.36, 1.2, -0.24], eR: [-0.3, -1, 0.8], eL: [-0.3, -1, -0.8], head: [0.1, 0.42], lean: 0.1, prop: 'chart', chart: 1 },
			{ t: 4.0, ...ABOUT, R: [0.3, 1.18, 0.05], L: [0.3, 1.18, -0.05], eR: [-0.3, -1, 0.8], eL: [-0.3, -1, -0.8], head: [0, 0.2], prop: 'chart', chart: 0 },
			{ t: 4.5, ...ABOUT, R: HANG_R, L: HANG_L }
		]
	},
	{
		name: 'parry', // draw the cutlass, high outside guard, a beat parry, recover to guard
		keys: [
			{ t: 0, ...ABOUT, R: HANG_R, L: HANG_L },
			{ t: 0.4, ...ABOUT, R: HOLSTER_R, L: HANG_L, aR: [0.1, -1, -0.35], eR: [0, -1, 1], head: [0.1, 0.12], twist: 0.12 },
			{ t: 0.75, ...ABOUT, R: [0.3, 1.15, 0.15], L: [0.0, 1.0, -0.33], aR: [0.8, 0.6, 0.1], eR: [0, -1, 1], prop: 'cutlass', drop: 0.04 },
			{ t: 1.25, ...ABOUT, yaw: -0.5, R: [0.45, 1.42, 0.36], L: [-0.05, 1.12, -0.4], aR: [0.55, 0.75, -0.35], eR: [0, -0.4, 1], prop: 'cutlass', drop: 0.08, head: [0.1, -0.03], twist: 0.15 },
			{ t: 1.5, ...ABOUT, yaw: -0.48, R: [0.42, 1.47, 0.32], L: [-0.05, 1.12, -0.4], aR: [0.45, 0.82, -0.35], eR: [0, -0.4, 1], prop: 'cutlass', drop: 0.09, head: [0.1, -0.05], twist: 0.1, jolt: 1 },
			{ t: 2.3, ...ABOUT, yaw: -0.5, R: [0.45, 1.42, 0.36], L: [-0.05, 1.12, -0.4], aR: [0.55, 0.75, -0.35], eR: [0, -0.4, 1], prop: 'cutlass', drop: 0.08, head: [0.1, -0.03], twist: 0.15 },
			{ t: 2.8, ...ABOUT, R: [0.42, 1.18, 0.3], L: [0.02, 1.05, -0.38], aR: [0.9, 0.35, 0.1], eR: [0, -0.8, 1], prop: 'cutlass', drop: 0.06 }
		]
	},
	{
		name: 'lunge', // step in with the right foot, extend, recover, sheath
		keys: [
			{ t: 0, ...ABOUT, R: [0.42, 1.18, 0.3], L: [0.02, 1.05, -0.38], aR: [0.9, 0.35, 0.1], eR: [0, -0.8, 1], prop: 'cutlass', drop: 0.06 },
			{ t: 0.45, ...ABOUT, R: [0.3, 1.22, 0.26], L: [-0.12, 1.08, -0.42], aR: [0.9, 0.3, 0.2], eR: [0, -0.8, 1], prop: 'cutlass', drop: 0.1, lean: 0.06 },
			{ t: 0.9, ...ABOUT, R: [0.68, 1.3, 0.5], L: [-0.32, 1.14, -0.48], aR: [0.85, 0.1, 0.5], eR: [0, -0.4, 1], prop: 'cutlass', drop: 0.17, lean: 0.2, step: 1, head: [0.25, -0.05], twist: 0.25 },
			{ t: 1.35, ...ABOUT, R: [0.68, 1.3, 0.5], L: [-0.32, 1.14, -0.48], aR: [0.85, 0.1, 0.5], eR: [0, -0.4, 1], prop: 'cutlass', drop: 0.17, lean: 0.2, step: 1, head: [0.25, -0.05], twist: 0.25 },
			{ t: 2.0, ...ABOUT, R: [0.42, 1.18, 0.3], L: [0.02, 1.05, -0.38], aR: [0.9, 0.35, 0.1], eR: [0, -0.8, 1], prop: 'cutlass', drop: 0.06 },
			{ t: 2.45, ...ABOUT, R: HOLSTER_R, L: HANG_L, aR: [0.1, -1, -0.35], eR: [0, -1, 1], prop: 'cutlass', head: [0.1, 0.12], twist: 0.12 },
			{ t: 2.8, ...ABOUT, R: HANG_R, L: HANG_L }
		]
	},
	{
		name: 'scan', // shade the eyes, sweep the horizon, walk back and take the wheel
		keys: [
			{ t: 0, ...ABOUT, R: HANG_R, L: HANG_L },
			{ t: 0.7, ...ABOUT, yaw: -0.3, R: HANG_R, L: [0.2, 1.68, -0.05], eL: [0.3, 0.2, -1], head: [0.3, -0.1] },
			{ t: 2.0, ...ABOUT, yaw: -0.3, R: HANG_R, L: [0.2, 1.68, -0.05], eL: [0.3, 0.2, -1], head: [-0.4, -0.1] },
			{ t: 2.6, ...ABOUT, yaw: -0.15, at: 0.5, R: HANG_R, L: HANG_L },
			{ t: 3.4, ...STEER },
			{ t: 5.0, ...STEER }
		]
	}
];
for (const a of ACTIONS) a.dur = a.keys[a.keys.length - 1].t;
const LOOP = ACTIONS.reduce((n, a) => n + a.dur, 0);

/** monotone cubic Hermite: velocity carries through a key unless the motion reverses or holds */
function hermite(p0, p1, p2, p3, u, d01, d12, d23) {
	const s0 = (p1 - p0) / d01,
		s1 = (p2 - p1) / d12,
		s2 = (p3 - p2) / d23;
	const m1 = s0 * s1 > 0 ? ((s0 + s1) / 2) * d12 : 0;
	const m2 = s1 * s2 > 0 ? ((s1 + s2) / 2) * d12 : 0;
	const u2 = u * u,
		u3 = u2 * u;
	return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
}
const VEC = ['R', 'L', 'eR', 'eL', 'aR'];
const NUM = ['yaw', 'at', 'lean', 'drop', 'twist', 'step', 'chart', 'wheel'];
function sampleKeys(keys, t) {
	let i = 0;
	while (i < keys.length - 2 && t > keys[i + 1].t) i++;
	const k0 = { ...STEER, ...keys[Math.max(i - 1, 0)] },
		a = { ...STEER, ...keys[i] },
		b = { ...STEER, ...keys[i + 1] },
		k3 = { ...STEER, ...keys[Math.min(i + 2, keys.length - 1)] };
	const d01 = Math.max(a.t - k0.t, 0.05),
		d12 = Math.max(b.t - a.t, 0.05),
		d23 = Math.max(k3.t - b.t, 0.05);
	const u = clamp((t - a.t) / d12, 0, 1);
	const h = (p0, p1, p2, p3) => hermite(p0, p1, p2, p3, u, d01, d12, d23);
	const out = {};
	for (const key of VEC) out[key] = [0, 1, 2].map((j) => h(k0[key][j], a[key][j], b[key][j], k3[key][j]));
	for (const key of NUM) out[key] = h(k0[key], a[key], b[key], k3[key]);
	out.head = [0, 1].map((j) => h(k0.head[j], a.head[j], b.head[j], k3.head[j]));
	// props change hands only where the hand is at the hip/coat (hidden by the switch point)
	out.prop = u < 0.5 ? a.prop : b.prop;
	out.jolt = b.jolt ? smooth(u) : a.jolt ? 1 - smooth(u) : 0;
	out.fireKey = !!a.fire && t - a.t < 0.05;
	return out;
}

/* ------------------------------------------------------------------ */
/* Loader + rig driver                                                 */
/* ------------------------------------------------------------------ */
/**
 * @param {string} url
 * @param {{ aboutMark: THREE.Vector3, onShot?: () => void }} opts
 */
export async function loadCaptain(url, opts) {
	const gltf = await new GLTFLoader().loadAsync(url);
	const root = new THREE.Group(); // captain space (sits on the deck at the helm)
	const body = new THREE.Group(); // where the captain stands and faces
	root.add(body);
	const model = gltf.scene;
	model.rotation.y = Math.PI / 2; // the model faces +Z; captain space faces +X
	body.add(model);
	let skinned = null;
	model.traverse((o) => {
		if (o.isSkinnedMesh) {
			skinned = o;
			o.frustumCulled = false;
			o.material.roughness = 0.78;
			o.material.metalness = 0;
			if (o.material.map) o.material.map.anisotropy = 8;
		}
	});
	if (!skinned) throw new Error('captain.glb has no skinned mesh');
	const byName = {};
	for (const b of skinned.skeleton.bones) byName[b.name.replace(/[^a-zA-Z]/g, '').toLowerCase()] = b;
	const B = (n) => {
		const b = byName[n.replace(/[^a-zA-Z]/g, '').toLowerCase()];
		if (!b) throw new Error('missing bone ' + n);
		return b;
	};
	const rig = {
		hips: B('hips'),
		spine: B('spine'),
		chest: B('chest'),
		neck: B('neck'),
		head: B('head'),
		upperR: B('upper_arm.R'),
		foreR: B('forearm.R'),
		handR: B('hand.R'),
		upperL: B('upper_arm.L'),
		foreL: B('forearm.L'),
		handL: B('hand.L'),
		thighR: B('thigh.R'),
		shinR: B('shin.R'),
		footR: B('foot.R'),
		thighL: B('thigh.L'),
		shinL: B('shin.L'),
		footL: B('foot.L')
	};
	const rest = new Map(skinned.skeleton.bones.map((b) => [b, { q: b.quaternion.clone(), p: b.position.clone() }]));
	root.updateMatrixWorld(true);

	const _q = new THREE.Quaternion(),
		_q2 = new THREE.Quaternion(),
		_pq = new THREE.Quaternion(),
		_m = new THREE.Matrix4(),
		_a = V(),
		_b = V();
	const wp = (b) => b.getWorldPosition(V());
	const toBoneDir = (bone, worldDir) => worldDir.clone().applyQuaternion(bone.getWorldQuaternion(_q).invert()).normalize();
	const fromBoneDir = (bone, localDir) => localDir.clone().applyQuaternion(bone.getWorldQuaternion(_q)).normalize();

	const armLen = [wp(rig.upperR).distanceTo(wp(rig.foreR)), wp(rig.foreR).distanceTo(wp(rig.handR))];
	const legLen = [wp(rig.thighR).distanceTo(wp(rig.shinR)), wp(rig.shinR).distanceTo(wp(rig.footR))];
	const rootWorldInv = () => root.matrixWorld.clone().invert();

	/* hand sockets, measured in the rest (A) pose: fingers continue the forearm, thumb points forward */
	const fwdWorld = V(1, 0, 0).transformDirection(root.matrixWorld);
	function socket(fore, hand) {
		const fingers = toBoneDir(hand, wp(hand).sub(wp(fore)));
		const thumbW = fwdWorld.clone();
		const thumb = toBoneDir(hand, thumbW);
		thumb.sub(fingers.clone().multiplyScalar(thumb.dot(fingers))).normalize();
		return { fingers, thumb, palm: fingers.clone().multiplyScalar(0.085) };
	}
	const sockR = socket(rig.foreR, rig.handR);
	const sockL = socket(rig.foreL, rig.handL);

	/* rest foot data, in body space */
	const toBody = (w) => body.worldToLocal(w.clone());
	const footRest = { R: toBody(wp(rig.footR)), L: toBody(wp(rig.footL)) };

	/* props: cutlass and pistol live in the right hand's socket */
	const props = makeProps();
	function mount(item, hand, sock) {
		// item +Y (blade / barrel) along the thumb axis, item +X (edge / trigger) along the fingers
		const y = sock.thumb.clone();
		const x = sock.fingers.clone();
		const z = V().crossVectors(x, y).normalize();
		item.quaternion.setFromRotationMatrix(_m.makeBasis(x, y, z));
		item.position.copy(sock.palm);
		hand.add(item);
		item.visible = false;
	}
	mount(props.cutlass, rig.handR, sockR);
	mount(props.pistol, rig.handR, sockR);
	root.add(props.chart, props.flash, props.smoke, props.flashLight);
	props.chart.visible = false;

	/* ---- world-space bone helpers ---- */
	function rotateWorld(bone, axis, angle) {
		if (!angle) return;
		bone.getWorldQuaternion(_q2);
		_q.setFromAxisAngle(axis, angle).multiply(_q2);
		bone.parent.getWorldQuaternion(_pq).invert();
		bone.quaternion.copy(_pq.multiply(_q));
		bone.updateMatrixWorld(true);
	}
	function setWorldQuat(bone, q) {
		bone.parent.getWorldQuaternion(_pq).invert();
		bone.quaternion.copy(_pq.multiply(q));
		bone.updateMatrixWorld(true);
	}
	function aimPoint(bone, fromW, toW) {
		const p = wp(bone);
		_a.copy(fromW).sub(p).normalize();
		_b.copy(toW).sub(p).normalize();
		_q.setFromUnitVectors(_a, _b);
		bone.getWorldQuaternion(_q2);
		setWorldQuat(bone, _q.multiply(_q2));
	}
	/** turn `bone` so its local axis `localAxis` points along `worldDir` (minimal rotation) */
	function alignAxis(bone, localAxis, worldDir) {
		const cur = fromBoneDir(bone, localAxis);
		_q.setFromUnitVectors(cur, worldDir.clone().normalize());
		bone.getWorldQuaternion(_q2);
		setWorldQuat(bone, _q.multiply(_q2));
	}
	function twoBone(b0, b1, b2, lens, target, pole) {
		const s = wp(b0);
		const d = V().subVectors(target, s);
		const dist = clamp(d.length(), Math.abs(lens[0] - lens[1]) + 0.01, (lens[0] + lens[1]) * 0.998);
		d.normalize();
		const a = (lens[0] * lens[0] - lens[1] * lens[1] + dist * dist) / (2 * dist);
		const h = Math.sqrt(Math.max(lens[0] * lens[0] - a * a, 0));
		const side = pole.clone().sub(d.clone().multiplyScalar(pole.dot(d)));
		if (side.lengthSq() < 1e-6) side.set(0, -1, 0);
		side.normalize();
		const joint = s.clone().addScaledVector(d, a).addScaledVector(side, h);
		aimPoint(b0, wp(b1), joint);
		aimPoint(b1, wp(b2), s.clone().addScaledVector(d, dist));
	}
	/** arm IK to a palm target; optional item axis for the hand (thumb side) */
	function arm(upper, fore, hand, sock, palmW, poleW, axisW) {
		let wristT = palmW.clone().sub(palmW.clone().sub(wp(upper)).normalize().multiplyScalar(0.085));
		for (let it = 0; it < 2; it++) {
			twoBone(upper, fore, hand, armLen, wristT, poleW);
			if (axisW) alignAxis(hand, sock.thumb, axisW);
			// correct the wrist so the palm (not the wrist) lands on the target
			const palmNow = sock.palm.clone().applyMatrix4(hand.matrixWorld);
			wristT.add(palmW.clone().sub(palmNow));
		}
	}

	/* ---- blade clearance: keep the 0.8 m cutlass out of the torso, face and hat ---- */
	function clearBlade(gripW, dirW) {
		const d = dirW.clone().normalize();
		const hipsW = wp(rig.hips),
			headW = wp(rig.head).add(V(0, 0.12, 0).applyQuaternion(root.getWorldQuaternion(_q)));
		for (let it = 0; it < 6; it++) {
			let push = null;
			for (let s = 0.1; s <= 0.75; s += 0.08) {
				const p = gripW.clone().addScaledVector(d, s);
				// torso capsule (hips → neck), radius 0.24
				const ax = V().subVectors(wp(rig.neck), hipsW);
				const t = clamp(p.clone().sub(hipsW).dot(ax) / ax.lengthSq(), 0, 1);
				const c = hipsW.clone().addScaledVector(ax, t);
				const off = p.clone().sub(c);
				if (off.length() < 0.24) push = off.normalize();
				// head and hat, radius 0.3
				const oh = p.clone().sub(headW);
				if (oh.length() < 0.3) push = oh.normalize();
				if (push) break;
			}
			if (!push) break;
			d.addScaledVector(push, 0.35).normalize();
		}
		return d;
	}

	/* ---- feet: planted on the deck, stepping when the stance moves ---- */
	const feet = {
		R: { plant: null, from: V(), to: V(), t: 1, yaw: 0, yawFrom: 0, yawTo: 0 },
		L: { plant: null, from: V(), to: V(), t: 1, yaw: 0, yawFrom: 0, yawTo: 0 }
	};
	const STEP = 0.32;
	function updateFeet(desired, yaw, dt) {
		for (const side of ['R', 'L']) {
			const f = feet[side];
			if (!f.plant) {
				f.plant = desired[side].clone();
				f.yaw = yaw;
			}
			if (f.t < 1) {
				f.t = Math.min(1, f.t + dt / STEP);
				const e = smooth(f.t);
				f.plant.lerpVectors(f.from, f.to, e);
				f.plant.y = f.from.y + (f.to.y - f.from.y) * e + Math.sin(f.t * Math.PI) * 0.07;
				f.yaw = f.yawFrom + (f.yawTo - f.yawFrom) * e;
			}
		}
		// one foot at a time: the one that is furthest from where it should be
		if (feet.R.t >= 1 && feet.L.t >= 1) {
			let worst = null,
				wd = 0;
			for (const side of ['R', 'L']) {
				const f = feet[side];
				const d = f.plant.distanceTo(desired[side]) + Math.abs(f.yaw - yaw) * 0.25;
				if (d > 0.07 && d > wd) {
					wd = d;
					worst = side;
				}
			}
			if (worst) {
				const f = feet[worst];
				f.from.copy(f.plant);
				f.to.copy(desired[worst]);
				f.yawFrom = f.yaw;
				f.yawTo = yaw;
				f.t = 0;
			}
		}
	}

	/* ---- state ---- */
	let seqT = -1,
		shotFired = false;
	const P = {}; // damped pose actually shown
	const damp = (cur, target, dt, tau = 0.11) => cur + (target - cur) * (1 - Math.exp(-dt / tau));
	const flashT = { t: 9 };

	/**
	 * @param {{ time: number, dt: number, mode: 'steer'|'about', grips?: {pos: THREE.Vector3, axis: THREE.Vector3}[], roll?: number, pitch?: number }} s
	 *   grips: the wheel handles in captain space [right, left], with their radial axis
	 */
	function update(s) {
		const dt = Math.min(s.dt, 0.1);
		if (s.mode === 'about') {
			if (seqT < 0) {
				seqT = 0;
				shotFired = false;
			}
			seqT += dt;
		} else seqT = -1;

		// target pose from the timeline
		let K;
		if (seqT >= 0) {
			let t = seqT % LOOP,
				ai = 0;
			while (ai < ACTIONS.length - 1 && t > ACTIONS[ai].dur) t -= ACTIONS[ai++].dur;
			K = sampleKeys(ACTIONS[ai].keys, t);
			if (ai === 0 && t > 2.1 && !shotFired) {
				shotFired = true;
				flashT.t = 0;
				if (seqT < LOOP) opts.onShot?.(); // the page glass only takes the first ball of each visit
			}
			if (ai !== 0) shotFired = false;
		} else K = sampleKeys([{ t: 0 }, { t: 1 }], 0);

		// critically damped blend toward the target: 0.2–0.4 s settles, never a snap
		if (!P.R) Object.assign(P, JSON.parse(JSON.stringify(K)));
		for (const k of VEC) for (let j = 0; j < 3; j++) P[k][j] = damp(P[k][j], K[k][j], dt);
		for (const k of NUM) P[k] = damp(P[k], K[k], dt);
		for (let j = 0; j < 2; j++) P.head[j] = damp(P.head[j], K.head[j], dt);
		P.prop = K.prop;
		P.jolt = K.jolt;

		// stance: step to the About mark and turn toward the camera
		const at = smooth(P.at);
		body.position.lerpVectors(V(), opts.aboutMark, at);
		body.rotation.y = P.yaw;

		// reset the skeleton to rest
		for (const [b, r] of rest) {
			b.quaternion.copy(r.q);
			b.position.copy(r.p);
		}
		root.updateMatrixWorld(true);

		const bodyQ = body.getWorldQuaternion(new THREE.Quaternion());
		const up = V(0, 1, 0).applyQuaternion(root.getWorldQuaternion(_q));
		const fwd = V(1, 0, 0).applyQuaternion(bodyQ);
		const right = V(0, 0, 1).applyQuaternion(bodyQ);
		const B2W = (arr) => body.localToWorld(V(arr[0], arr[1], arr[2]));
		const D2W = (arr) => V(arr[0], arr[1], arr[2]).normalize().applyQuaternion(bodyQ);

		// feet: where each foot wants to be (body space → captain space), stepping to get there
		const lungeR = V(0.42, 0, 0.2).multiplyScalar(P.step);
		const lungeL = V(-0.1, 0, -0.02).multiplyScalar(P.step);
		const wantR = root.worldToLocal(body.localToWorld(footRest.R.clone().add(lungeR)));
		const wantL = root.worldToLocal(body.localToWorld(footRest.L.clone().add(lungeL)));
		updateFeet({ R: wantR, L: wantL }, P.yaw, dt);
		const plantR = root.localToWorld(feet.R.plant.clone()),
			plantL = root.localToWorld(feet.L.plant.clone());

		// pelvis: drop, settle over the support foot, counter the deck's roll
		const support = feet.R.t < 1 ? plantL : feet.L.t < 1 ? plantR : plantR.clone().lerp(plantL, 0.5);
		const hipsW = wp(rig.hips);
		const shift = support.clone().sub(hipsW);
		shift.y = 0;
		const shiftLocal = shift.multiplyScalar(0.35 + 0.25 * (feet.R.t < 1 || feet.L.t < 1 ? 1 : 0));
		const hipsTarget = hipsW.clone().add(shiftLocal).addScaledVector(up, -(P.drop + Math.abs(Math.sin(s.time * 0.7)) * 0.004));
		hipsTarget.addScaledVector(fwd, P.step * 0.18);
		rig.hips.position.add(rig.hips.parent.worldToLocal(hipsTarget.clone()).sub(rig.hips.parent.worldToLocal(hipsW.clone())));
		rig.hips.updateMatrixWorld(true);
		rotateWorld(rig.hips, fwd, -(s.roll || 0) * 0.45 + clamp(shift.dot(right), -0.1, 0.1) * 0.6);

		// shoulders counter-rotate against the hips; the leading hand pulls its shoulder forward
		const lead = clamp((P.R[0] - P.L[0]) * 0.45, -0.32, 0.32);
		rotateWorld(rig.hips, up, -lead * 0.35 + P.twist * -0.3);
		const breathe = Math.sin(s.time * 1.6) * 0.012;
		rotateWorld(rig.spine, right, -(P.lean + breathe) * 0.55 + (s.pitch || 0) * 0.35);
		rotateWorld(rig.spine, up, (lead + P.twist) * 0.45);
		rotateWorld(rig.chest, right, -(P.lean + breathe) * 0.45);
		rotateWorld(rig.chest, up, (lead + P.twist) * 0.55);
		if (P.jolt) rotateWorld(rig.chest, up, -0.07 * Math.sin(P.jolt * Math.PI));

		// arms: palms to their targets (the wheel handles while steering)
		const wheelW = clamp(P.wheel, 0, 1);
		let palmR = B2W(P.R),
			palmL = B2W(P.L),
			axisR = null,
			axisL = null;
		if (s.grips && wheelW > 0.001) {
			const gR = root.localToWorld(s.grips[0].pos.clone()),
				gL = root.localToWorld(s.grips[1].pos.clone());
			palmR.lerp(gR, wheelW);
			palmL.lerp(gL, wheelW);
			if (wheelW > 0.6) {
				axisR = s.grips[0].axis.clone().transformDirection(root.matrixWorld);
				axisL = s.grips[1].axis.clone().transformDirection(root.matrixWorld);
			}
		}
		const holding = P.prop === 'cutlass' || P.prop === 'pistol';
		if (holding) {
			const gripGuess = palmR.clone();
			axisR = clearBlade(gripGuess, D2W(P.aR));
		}
		arm(rig.upperR, rig.foreR, rig.handR, sockR, palmR, D2W(P.eR), axisR);
		arm(rig.upperL, rig.foreL, rig.handL, sockL, palmL, D2W(P.eL), axisL);
		if (holding) {
			// with the real grip known, re-check clearance and settle the hand's angle
			const gripW = sockR.palm.clone().applyMatrix4(rig.handR.matrixWorld);
			alignAxis(rig.handR, sockR.thumb, clearBlade(gripW, axisR));
		}

		// legs to the planted feet; feet flat on the deck, toes along the stance
		twoBone(rig.thighR, rig.shinR, rig.footR, legLen, plantR, fwd.clone().add(right.clone().multiplyScalar(0.1)));
		twoBone(rig.thighL, rig.shinL, rig.footL, legLen, plantL, fwd.clone().add(right.clone().multiplyScalar(-0.1)));
		for (const [bone, side] of [
			[rig.footR, 'R'],
			[rig.footL, 'L']
		]) {
			const yaw = feet[side].yaw;
			const toe = V(Math.cos(yaw), 0, -Math.sin(yaw)).transformDirection(root.matrixWorld);
			toe.addScaledVector(up, -0.38).normalize();
			alignAxis(bone, V(0, 1, 0), toe);
		}

		// head: look about at the helm; at the job in hand in About
		const look = Math.sin(s.time * 0.31) * 0.1 * (1 - at) + P.head[0];
		rotateWorld(rig.neck, up, look * 0.4);
		rotateWorld(rig.head, up, look * 0.6);
		rotateWorld(rig.head, right, -P.head[1] + Math.sin(s.time * 0.45) * 0.015);

		placeProps(P, dt);
	}

	function placeProps(k, dt) {
		props.pistol.visible = k.prop === 'pistol';
		props.cutlass.visible = k.prop === 'cutlass';
		props.chart.visible = k.prop === 'chart';
		root.updateMatrixWorld(true);
		if (props.chart.visible) {
			const pr = root.worldToLocal(sockR.palm.clone().applyMatrix4(rig.handR.matrixWorld));
			const pl = root.worldToLocal(sockL.palm.clone().applyMatrix4(rig.handL.matrixWorld));
			const mid = V().addVectors(pr, pl).multiplyScalar(0.5);
			const span = Math.max(pr.distanceTo(pl), 0.04);
			const open = Math.max(k.chart, 0.08);
			const across = V().subVectors(pr, pl).normalize();
			const faceDir = V().crossVectors(V(0, 1, 0), across).normalize(); // toward the reader
			const upDir = V().crossVectors(across, faceDir).normalize();
			props.chart.quaternion.setFromRotationMatrix(_m.makeBasis(across, upDir, faceDir.negate()));
			props.chart.rotateX(-0.85);
			props.chart.position.copy(mid).addScaledVector(upDir, 0.03);
			props.sheet.scale.x = span * open;
			props.rollL.position.x = (-span * open) / 2;
			props.rollR.position.x = (span * open) / 2;
		}
		flashT.t += dt;
		const muzzleL = root.worldToLocal(props.muzzle.getWorldPosition(V()));
		const f = Math.max(0, 1 - flashT.t / 0.12);
		props.flash.position.copy(muzzleL);
		props.flash.material.opacity = f;
		props.flash.scale.setScalar(0.6 + (1 - f) * 1.4);
		props.flashLight.position.copy(muzzleL);
		props.flashLight.intensity = f * 9;
		const sm = Math.min(flashT.t / 2.4, 1);
		props.smoke.material.opacity = flashT.t < 2.4 ? 0.35 * (1 - sm) * Math.min(1, flashT.t * 10) : 0;
		props.smoke.scale.setScalar(0.25 + sm * 0.9);
		if (flashT.t < 0.05) props.smoke.position.copy(muzzleL);
		else props.smoke.position.y += dt * 0.08;
	}

	return { root, update, skinned, bones: rig, props };
}
