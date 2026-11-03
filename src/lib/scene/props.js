// @ts-nocheck — three ships no bundled types; this file is checked by running it.
/**
 * Story props for the voyage, all original and generated in code:
 *  - the captain (an original character: navy greatcoat, bicorne with a teal
 *    plume, grey beard and a brass monocle-lens),
 *  - a detailed ship's wheel on a pedestal,
 *  - a chart table with a live treasure map (project destinations),
 *  - a compass, a telescope, the ship's logbook with quill and inkwell,
 *  - a treasure chest that opens at the end of the voyage.
 */
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/* ------------------------------------------------------------------ */
/* Shared materials                                                     */
/* ------------------------------------------------------------------ */
export function makeMaterials() {
	return {
		wood: new THREE.MeshStandardMaterial({ color: '#3b2817', roughness: 0.78 }),
		darkWood: new THREE.MeshStandardMaterial({ color: '#24170e', roughness: 0.85 }),
		brass: new THREE.MeshStandardMaterial({ color: '#c8913c', metalness: 0.9, roughness: 0.32 }),
		iron: new THREE.MeshStandardMaterial({ color: '#16181b', metalness: 0.7, roughness: 0.5 }),
		leather: new THREE.MeshStandardMaterial({ color: '#4a2a18', roughness: 0.7 }),
		teal: new THREE.MeshBasicMaterial({ color: '#5ad6c9', toneMapped: false }),
		glow: new THREE.MeshBasicMaterial({ color: '#ffcf7a', toneMapped: false })
	};
}

/** Position/orient a unit-height cylinder so it spans from a to b. */
function span(mesh, a, b) {
	const d = new THREE.Vector3().subVectors(b, a);
	const len = d.length();
	mesh.position.copy(a).addScaledVector(d, 0.5);
	mesh.quaternion.setFromUnitVectors(UP, d.normalize());
	mesh.scale.set(1, len, 1);
}

/* ------------------------------------------------------------------ */
/* Ship's wheel                                                        */
/* ------------------------------------------------------------------ */
export function makeWheel(m) {
	const root = new THREE.Group();
	// pedestal
	const ped = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.34), m.darkWood);
	ped.position.y = 0.45;
	root.add(ped);
	const cap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.4), m.brass);
	cap.position.y = 0.92;
	root.add(cap);
	const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 10), m.brass);
	axle.rotation.z = Math.PI / 2;
	axle.position.set(0.12, 0.95, 0);
	root.add(axle);

	// the wheel itself turns about local x
	const wheel = new THREE.Group();
	wheel.position.set(0.28, 0.95, 0);
	const rimGeo = new THREE.TorusGeometry(0.42, 0.032, 10, 48);
	rimGeo.rotateY(Math.PI / 2);
	wheel.add(new THREE.Mesh(rimGeo, m.wood));
	const innerGeo = new THREE.TorusGeometry(0.2, 0.022, 8, 32);
	innerGeo.rotateY(Math.PI / 2);
	wheel.add(new THREE.Mesh(innerGeo, m.wood));
	const brassRing = new THREE.TorusGeometry(0.43, 0.008, 6, 48);
	brassRing.rotateY(Math.PI / 2);
	const ringMesh = new THREE.Mesh(brassRing, m.brass);
	ringMesh.position.x = 0.03;
	wheel.add(ringMesh);
	const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 16), m.brass);
	hub.rotation.z = Math.PI / 2;
	wheel.add(hub);
	const spokeGeo = new THREE.CylinderGeometry(0.016, 0.02, 0.5, 8);
	const handleGeo = new THREE.CylinderGeometry(0.022, 0.03, 0.16, 10);
	const knobGeo = new THREE.SphereGeometry(0.03, 10, 8);
	for (let i = 0; i < 8; i++) {
		const a = (i / 8) * Math.PI * 2;
		const dir = new THREE.Vector3(0, Math.cos(a), Math.sin(a));
		const spoke = new THREE.Mesh(spokeGeo, m.wood);
		spoke.position.copy(dir).multiplyScalar(0.25);
		spoke.quaternion.setFromUnitVectors(UP, dir);
		wheel.add(spoke);
		const handle = new THREE.Mesh(handleGeo, m.wood);
		handle.position.copy(dir).multiplyScalar(0.54);
		handle.quaternion.setFromUnitVectors(UP, dir);
		wheel.add(handle);
		const knob = new THREE.Mesh(knobGeo, i === 0 ? m.brass : m.wood);
		knob.position.copy(dir).multiplyScalar(0.63);
		wheel.add(knob);
	}
	root.add(wheel);
	return { root, wheel };
}

/* ------------------------------------------------------------------ */
/* The captain                                                         */
/* ------------------------------------------------------------------ */
export function makeCaptain(m) {
	const root = new THREE.Group();
	const coat = new THREE.MeshStandardMaterial({ color: '#16233a', roughness: 0.72 });
	const coatLining = new THREE.MeshStandardMaterial({ color: '#5b1f1f', roughness: 0.8, side: THREE.DoubleSide });
	const shirt = new THREE.MeshStandardMaterial({ color: '#d9cdb2', roughness: 0.9 });
	const boots = new THREE.MeshStandardMaterial({ color: '#0f0b08', roughness: 0.5 });
	const trousers = new THREE.MeshStandardMaterial({ color: '#2d2a26', roughness: 0.85 });
	const skin = new THREE.MeshStandardMaterial({ color: '#8a5638', roughness: 0.6 });
	const beard = new THREE.MeshStandardMaterial({ color: '#17110d', roughness: 0.95 });
	const leather = new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: 0.55 });
	const hatMat = new THREE.MeshStandardMaterial({ color: '#0d1320', roughness: 0.6, side: THREE.DoubleSide });
	const glove = new THREE.MeshStandardMaterial({ color: '#2b1a10', roughness: 0.7 });

	// legs and boots
	for (const s of [-1, 1]) {
		const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.5, 10), trousers);
		leg.position.set(0, 0.62, s * 0.1);
		root.add(leg);
		const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.42, 12), boots);
		boot.position.set(0.01, 0.21, s * 0.1);
		root.add(boot);
		const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.095, 0.08, 12), boots);
		cuff.position.set(0.01, 0.43, s * 0.1);
		root.add(cuff);
		const toe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.12), boots);
		toe.position.set(0.07, 0.03, s * 0.1);
		root.add(toe);
	}

	// greatcoat: a lathe that flares to the hem; tails sway in the wind
	const pts = [
		[0.3, 0.42],
		[0.27, 0.6],
		[0.22, 0.95],
		[0.2, 1.05],
		[0.23, 1.3],
		[0.25, 1.42],
		[0.12, 1.5]
	].map(([r, y]) => new THREE.Vector2(r, y));
	const coatGeo = new THREE.LatheGeometry(pts, 24);
	coatGeo.scale(0.8, 1, 1.05);
	const coatMesh = new THREE.Mesh(coatGeo, coat);
	root.add(coatMesh);
	const lining = new THREE.Mesh(new THREE.LatheGeometry(pts.slice(0, 3).map((p) => new THREE.Vector2(p.x - 0.01, p.y)), 24, -0.6, 1.2), coatLining);
	lining.scale.set(0.8, 1, 1.05);
	root.add(lining);
	// open cream linen shirt under the greatcoat, collar points out
	const shirtFront = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.2), shirt);
	shirtFront.position.set(0.17, 1.15, 0);
	root.add(shirtFront);
	for (const s of [-1, 1]) {
		const collar = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 3), shirt);
		collar.rotation.set(s * 0.5, 0, Math.PI * 0.8);
		collar.position.set(0.19, 1.43, s * 0.06);
		root.add(collar);
	}
	// dark leather baldric from the left shoulder to the right hip, brass buckle
	const baldric = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.78, 0.075), leather);
	baldric.position.set(0.215, 1.17, 0.0);
	baldric.rotation.x = -0.62;
	root.add(baldric);
	const bBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.09), m.brass);
	bBuckle.position.set(0.235, 1.12, 0.03);
	bBuckle.rotation.x = -0.62;
	root.add(bBuckle);
	const belt = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.022, 6, 24), new THREE.MeshStandardMaterial({ color: '#1a120c', roughness: 0.6 }));
	belt.rotation.x = Math.PI / 2;
	belt.scale.set(0.8, 1.05, 1);
	belt.position.y = 1.0;
	root.add(belt);
	const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.09), m.brass);
	buckle.position.set(0.17, 1.0, 0);
	root.add(buckle);
	for (let i = 0; i < 4; i++) {
		for (const s of [-1, 1]) {
			const b = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), m.brass);
			b.position.set(0.19, 1.07 + i * 0.075, s * 0.085);
			root.add(b);
		}
	}
	// head
	const head = new THREE.Group();
	head.position.set(0.02, 1.62, 0);
	const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.1, 10), skin);
	neck.position.y = -0.1;
	head.add(neck);
	const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), skin);
	skull.scale.set(1, 1.12, 0.95);
	head.add(skull);
	const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 8), skin);
	nose.rotation.z = -Math.PI / 2;
	nose.position.set(0.12, 0.0, 0);
	head.add(nose);
	// trimmed beard along the jaw and chin
	const beardMesh = new THREE.Mesh(new THREE.SphereGeometry(0.104, 16, 12, Math.PI * 0.5, Math.PI, Math.PI * 0.6, Math.PI * 0.4), beard);
	beardMesh.scale.set(1.04, 1.06, 1.02);
	beardMesh.position.set(0.02, -0.02, 0);
	head.add(beardMesh);
	const moustache = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI), beard);
	moustache.rotation.set(0, Math.PI / 2, Math.PI);
	moustache.position.set(0.11, -0.035, 0);
	head.add(moustache);
	for (const s of [-1, 1]) {
		const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: '#111' }));
		eye.position.set(0.105, 0.035, s * 0.042);
		head.add(eye);
		const brow = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 0.045), beard);
		brow.position.set(0.11, 0.06, s * 0.042);
		brow.rotation.x = s * 0.15;
		head.add(brow);
	}
	// short dark hair under the hat
	const hair = new THREE.Mesh(new THREE.SphereGeometry(0.122, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), beard);
	hair.scale.set(1.02, 1.1, 0.98);
	hair.position.set(-0.01, 0.015, 0);
	head.add(hair);
	// bicorne hat worn fore-and-aft, with a teal plume
	const hatShape = new THREE.Shape();
	hatShape.moveTo(-0.24, 0);
	hatShape.quadraticCurveTo(-0.18, 0.06, 0, 0.17);
	hatShape.quadraticCurveTo(0.18, 0.06, 0.24, 0);
	hatShape.quadraticCurveTo(0, 0.04, -0.24, 0);
	const hatGeo = new THREE.ExtrudeGeometry(hatShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2 });
	hatGeo.translate(0, 0, -0.1);
	const hatGroup = new THREE.Group();
	hatGroup.rotation.y = Math.PI / 2; // worn side-to-side, as in Arul's portrait
	hatGroup.position.y = -0.005;
	head.add(hatGroup);
	const hat = new THREE.Mesh(hatGeo, hatMat);
	hat.position.set(0, 0.08, 0);
	hatGroup.add(hat);
	const trimPts = [];
	for (let i = 0; i <= 24; i++) {
		const u = i / 24;
		const x = -0.24 + u * 0.48;
		const y = 0.17 * (1 - Math.pow(Math.abs(x) / 0.24, 1.6));
		trimPts.push(new THREE.Vector3(x, y + 0.09, 0.115));
	}
	const trim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trimPts), 32, 0.007, 5), m.brass);
	hatGroup.add(trim);
	const trim2 = trim.clone();
	trim2.position.z = -0.23;
	hatGroup.add(trim2);
	const cockade = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), m.brass);
	cockade.position.set(0.1, 0.17, 0.118);
	hatGroup.add(cockade);
	// a small teal feather plume tucked behind the cockade
	const plumeMat = new THREE.MeshStandardMaterial({ color: '#1f6f6a', roughness: 0.85, emissive: '#0d3431' });
	for (let i = 0; i < 3; i++) {
		const f = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.2 - i * 0.03, 6), plumeMat);
		f.scale.z = 0.4;
		f.rotation.set(0, 0, -0.5 - i * 0.25);
		f.position.set(0.13 + i * 0.015, 0.25 - i * 0.015, 0.11);
		hatGroup.add(f);
	}
	root.add(head);

	// arms: shoulder → elbow → hand, solved each frame toward the wheel
	const upperGeo = new THREE.CylinderGeometry(0.06, 0.055, 1, 10);
	const lowerGeo = new THREE.CylinderGeometry(0.052, 0.045, 1, 10);
	const cuffGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10);
	const handGeo = new THREE.SphereGeometry(0.042, 10, 8);
	const arms = [-1, 1].map((s) => {
		const upper = new THREE.Mesh(upperGeo, coat);
		const lower = new THREE.Mesh(lowerGeo, coat);
		const cuff = new THREE.Mesh(cuffGeo, m.brass);
		const hand = new THREE.Mesh(handGeo, glove);
		root.add(upper, lower, cuff, hand);
		return { s, upper, lower, cuff, hand, shoulder: new THREE.Vector3(0.02, 1.4, s * 0.24) };
	});

	const elbow = new THREE.Vector3();
	/**
	 * @param {THREE.Vector3[]} targets hand targets in the captain's local space
	 * @param {(THREE.Vector3|null)[]} [hints] optional elbow positions (local), e.g. raised for a salute
	 * @param {number[]} [hintW] 0..1 blend toward each hint
	 */
	function reach(targets, hints = [], hintW = []) {
		for (const [i, arm] of arms.entries()) {
			const t = targets[i];
			const sh = arm.shoulder;
			// simple two-bone solve: elbow out and down from the midpoint
			const L1 = 0.32,
				L2 = 0.3;
			const d = sh.distanceTo(t);
			const mid = new THREE.Vector3().addVectors(sh, t).multiplyScalar(0.5);
			const bend = Math.sqrt(Math.max(0, (L1 + L2) * (L1 + L2) / 4 - (d * d) / 4));
			elbow.copy(mid).addScaledVector(new THREE.Vector3(-0.05, -1, arm.s * 0.6).normalize(), bend * 1.17);
			// a hint is an explicit elbow position (e.g. raised out to the side for a salute)
			if (hints[i] && hintW[i]) elbow.lerp(hints[i], hintW[i]);
			span(arm.upper, sh, elbow);
			span(arm.lower, elbow, t);
			arm.cuff.position.copy(elbow).lerp(t, 0.82);
			arm.cuff.quaternion.copy(arm.lower.quaternion);
			arm.hand.position.copy(t);
		}
	}

	return { root, head, coatMesh, reach };
}

/* ------------------------------------------------------------------ */
/* Treasure map (live canvas texture)                                  */
/* ------------------------------------------------------------------ */
function rng(seed) {
	let s = seed >>> 0;
	return () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function blob(ctx, cx, cy, r, seed) {
	const rand = rng(seed);
	ctx.beginPath();
	const n = 26;
	const radii = Array.from({ length: n }, () => r * (0.7 + rand() * 0.5));
	for (let i = 0; i <= n; i++) {
		const a = (i / n) * Math.PI * 2;
		const rr = (radii[i % n] + radii[(i + 1) % n] + radii[(i + n - 1) % n]) / 3;
		const x = cx + Math.cos(a) * rr * 1.25;
		const y = cy + Math.sin(a) * rr;
		i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
	}
	ctx.closePath();
}

/** Island positions on the chart, in map-texture pixels (1024 × 704), laid out as a voyage left → right. */
export const MAP_SPOTS = [
	[150, 470],
	[300, 230],
	[470, 450],
	[620, 210],
	[770, 430],
	[890, 220]
];

/**
 * @param {{ title: string }[]} destinations
 */
export function makeMapTexture(destinations) {
	const W = 1024,
		H = 704;
	const c = document.createElement('canvas');
	c.width = W;
	c.height = H;
	const ctx = c.getContext('2d');
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 8;

	const spots = MAP_SPOTS.slice(0, destinations.length);

	// static layer (parchment, coasts, rose) drawn once
	const base = document.createElement('canvas');
	base.width = W;
	base.height = H;
	const b = base.getContext('2d');
	const r = rng(5);
	const g = b.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7);
	g.addColorStop(0, '#efe0bc');
	g.addColorStop(0.7, '#dcc595');
	g.addColorStop(1, '#a5834f');
	b.fillStyle = g;
	b.fillRect(0, 0, W, H);
	for (let i = 0; i < 40; i++) {
		const x = r() * W,
			y = r() * H,
			rad = 20 + r() * 90;
		const s = b.createRadialGradient(x, y, 0, x, y, rad);
		s.addColorStop(0, `rgba(120,80,30,${0.04 + r() * 0.08})`);
		s.addColorStop(1, 'rgba(120,80,30,0)');
		b.fillStyle = s;
		b.fillRect(x - rad, y - rad, rad * 2, rad * 2);
	}
	// grid / rhumb lines
	b.strokeStyle = 'rgba(90,60,25,0.18)';
	b.lineWidth = 1;
	for (let x = 0; x < W; x += 64) {
		b.beginPath();
		b.moveTo(x, 0);
		b.lineTo(x, H);
		b.stroke();
	}
	for (let y = 0; y < H; y += 64) {
		b.beginPath();
		b.moveTo(0, y);
		b.lineTo(W, y);
		b.stroke();
	}
	// coasts
	const isles = spots.map(([x, y], i) => [x, y, 46 + (i % 3) * 8, 300 + i * 17]);
	isles.push([60, 120, 60, 999], [980, 640, 70, 998], [520, 640, 40, 997]);
	for (const [x, y, rad, seed] of isles) {
		for (let k = 3; k >= 1; k--) {
			blob(b, x, y, rad + k * 9, seed);
			b.strokeStyle = `rgba(70,50,25,${0.12 * k})`;
			b.stroke();
		}
		blob(b, x, y, rad, seed);
		b.fillStyle = '#cdb27a';
		b.fill();
		b.strokeStyle = '#5a3d1a';
		b.lineWidth = 2.5;
		b.stroke();
		// hatching for hills
		b.strokeStyle = 'rgba(90,60,25,.45)';
		b.lineWidth = 1.2;
		for (let k = 0; k < 5; k++) {
			const hx = x - rad * 0.5 + r() * rad;
			const hy = y - rad * 0.3 + r() * rad * 0.6;
			b.beginPath();
			b.moveTo(hx - 8, hy + 4);
			b.lineTo(hx, hy - 6);
			b.lineTo(hx + 8, hy + 4);
			b.stroke();
		}
	}
	// compass rose
	b.save();
	b.translate(W - 120, H - 120);
	b.strokeStyle = '#5a3d1a';
	b.fillStyle = '#7a5520';
	b.lineWidth = 1.5;
	b.beginPath();
	b.arc(0, 0, 70, 0, Math.PI * 2);
	b.stroke();
	for (let i = 0; i < 8; i++) {
		b.rotate(Math.PI / 4);
		b.beginPath();
		b.moveTo(0, -(i % 2 ? 45 : 68));
		b.lineTo(7, 0);
		b.lineTo(-7, 0);
		b.closePath();
		i % 2 ? b.stroke() : b.fill();
	}
	b.restore();
	// sea monster flourishes: simple waves
	b.strokeStyle = 'rgba(70,50,25,.35)';
	for (let i = 0; i < 18; i++) {
		const x = r() * W,
			y = r() * H;
		b.beginPath();
		b.arc(x, y, 10, Math.PI * 1.1, Math.PI * 1.9);
		b.arc(x + 18, y, 10, Math.PI * 1.1, Math.PI * 1.9);
		b.stroke();
	}
	// title cartouche
	b.fillStyle = 'rgba(90,60,25,.85)';
	b.font = 'italic 600 34px Georgia, serif';
	b.fillText('The Voyage Log', 40, 60);
	b.font = '16px Georgia, serif';
	b.fillText('Charted by A. P. K. C.', 44, 84);
	// burnt edges
	const e = b.createRadialGradient(W / 2, H / 2, W * 0.42, W / 2, H / 2, W * 0.62);
	e.addColorStop(0, 'rgba(60,30,10,0)');
	e.addColorStop(1, 'rgba(50,25,8,0.75)');
	b.fillStyle = e;
	b.fillRect(0, 0, W, H);

	let lastKey = '';
	/**
	 * @param {number} reveal 0..1 how much of the route is drawn
	 * @param {number} active index of the highlighted destination (-1 none)
	 * @param {number} pulse 0..1 animation phase for the active ring
	 */
	function draw(reveal, active, pulse) {
		const key = `${Math.round(reveal * 60)}|${active}|${Math.round(pulse * 8)}`;
		if (key === lastKey) return;
		lastKey = key;
		ctx.drawImage(base, 0, 0);
		// dotted route, revealed progressively
		const n = spots.length;
		const total = reveal * (n - 1);
		ctx.strokeStyle = '#8a2a14';
		ctx.lineWidth = 4;
		ctx.setLineDash([12, 10]);
		ctx.beginPath();
		ctx.moveTo(spots[0][0], spots[0][1]);
		for (let i = 1; i < n; i++) {
			const f = Math.min(Math.max(total - (i - 1), 0), 1);
			if (f <= 0) break;
			const [x0, y0] = spots[i - 1];
			const [x1, y1] = spots[i];
			const cx = (x0 + x1) / 2,
				cy = (y0 + y1) / 2 - 60;
			// partial quadratic curve via subdivision
			const steps = 20;
			for (let k = 1; k <= steps * f; k++) {
				const t = k / steps;
				const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
				const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();
		ctx.setLineDash([]);
		// destinations
		for (let i = 0; i < n; i++) {
			const [x, y] = spots[i];
			const reached = i <= total + 0.001;
			if (i === active) {
				ctx.strokeStyle = `rgba(20,120,112,${0.9 - pulse * 0.6})`;
				ctx.lineWidth = 5;
				ctx.beginPath();
				ctx.arc(x, y, 34 + pulse * 22, 0, Math.PI * 2);
				ctx.stroke();
			}
			ctx.lineWidth = 6;
			ctx.strokeStyle = reached ? '#8a2a14' : 'rgba(90,60,25,.45)';
			ctx.beginPath();
			ctx.moveTo(x - 14, y - 14);
			ctx.lineTo(x + 14, y + 14);
			ctx.moveTo(x + 14, y - 14);
			ctx.lineTo(x - 14, y + 14);
			ctx.stroke();
			ctx.fillStyle = i === active ? '#0f5f58' : '#3d2810';
			ctx.font = `${i === active ? 'bold ' : ''}26px Georgia, serif`;
			ctx.textAlign = 'center';
			ctx.fillText(destinations[i].title, x, y + 52);
			ctx.font = 'bold 18px Georgia, serif';
			ctx.fillText(String(i + 1).padStart(2, '0'), x, y - 26);
		}
		ctx.textAlign = 'start';
		tex.needsUpdate = true;
	}
	draw(0, -1, 0);
	return { tex, draw, aspect: W / H };
}

/* ------------------------------------------------------------------ */
/* Chart table with map, compass, telescope, logbook, lantern          */
/* ------------------------------------------------------------------ */
function compassTexture() {
	const c = document.createElement('canvas');
	c.width = c.height = 256;
	const x = c.getContext('2d');
	x.fillStyle = '#eadcb8';
	x.beginPath();
	x.arc(128, 128, 126, 0, Math.PI * 2);
	x.fill();
	x.strokeStyle = '#5a3d1a';
	x.lineWidth = 2;
	for (let i = 0; i < 64; i++) {
		const a = (i / 64) * Math.PI * 2;
		const r0 = i % 8 === 0 ? 96 : 108;
		x.beginPath();
		x.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0);
		x.lineTo(128 + Math.cos(a) * 120, 128 + Math.sin(a) * 120);
		x.stroke();
	}
	x.fillStyle = '#3d2810';
	x.font = 'bold 28px Georgia, serif';
	x.textAlign = 'center';
	x.textBaseline = 'middle';
	[['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([l, d]) => {
		const a = ((d - 90) * Math.PI) / 180;
		x.fillText(l, 128 + Math.cos(a) * 78, 128 + Math.sin(a) * 78);
	});
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

function logbookTexture() {
	const c = document.createElement('canvas');
	c.width = 512;
	c.height = 360;
	const x = c.getContext('2d');
	const r = rng(42);
	x.fillStyle = '#efe2c2';
	x.fillRect(0, 0, 512, 360);
	x.fillStyle = 'rgba(120,80,30,.15)';
	x.fillRect(250, 0, 12, 360); // gutter shadow
	x.strokeStyle = 'rgba(80,60,40,.25)';
	for (let y = 50; y < 340; y += 18) {
		for (const [a, b] of [
			[20, 236],
			[276, 492]
		]) {
			x.beginPath();
			x.moveTo(a, y);
			x.lineTo(b, y);
			x.stroke();
		}
	}
	x.fillStyle = '#3a2814';
	x.font = 'italic 22px Georgia, serif';
	x.fillText('Crew record', 24, 34);
	x.fillText('Ports of study', 280, 34);
	// handwriting: wavy ink strokes (not real text)
	x.strokeStyle = 'rgba(40,25,12,.75)';
	x.lineWidth = 1.6;
	for (const [a, b] of [
		[24, 230],
		[280, 488]
	]) {
		for (let y = 64; y < 330; y += 18) {
			if (r() < 0.15) continue;
			let px = a;
			x.beginPath();
			x.moveTo(px, y - 4);
			const end = a + (b - a) * (0.55 + r() * 0.45);
			while (px < end) {
				const w = 6 + r() * 14;
				x.bezierCurveTo(px + w * 0.3, y - 10, px + w * 0.6, y + 2, px + w, y - 4);
				px += w + (r() < 0.2 ? 6 : 0);
				if (r() < 0.2) x.moveTo(px, y - 4);
			}
			x.stroke();
		}
	}
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 4;
	return t;
}

export function makeChartTable(m, destinations) {
	const root = new THREE.Group();
	const topW = 1.4,
		topD = 0.95,
		topY = 0.82;
	const top = new THREE.Mesh(new THREE.BoxGeometry(topW, 0.06, topD), m.wood);
	top.position.y = topY;
	root.add(top);
	const apron = new THREE.Mesh(new THREE.BoxGeometry(topW - 0.1, 0.12, topD - 0.1), m.darkWood);
	apron.position.y = topY - 0.08;
	root.add(apron);
	const legGeo = new THREE.CylinderGeometry(0.035, 0.05, topY - 0.06, 10);
	for (const [sx, sz] of [
		[-1, -1],
		[1, -1],
		[-1, 1],
		[1, 1]
	]) {
		const leg = new THREE.Mesh(legGeo, m.darkWood);
		leg.position.set(sx * (topW / 2 - 0.08), (topY - 0.06) / 2, sz * (topD / 2 - 0.08));
		root.add(leg);
		const foot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), m.brass);
		foot.position.set(sx * (topW / 2 - 0.08), 0.03, sz * (topD / 2 - 0.08));
		root.add(foot);
	}

	// the map, slightly curled at the corners
	const map = makeMapTexture(destinations);
	const mapW = 1.05,
		mapH = mapW / map.aspect;
	const mapGeo = new THREE.PlaneGeometry(mapW, mapH, 24, 16);
	const p = mapGeo.attributes.position;
	for (let i = 0; i < p.count; i++) {
		const u = p.getX(i) / (mapW / 2),
			v = p.getY(i) / (mapH / 2);
		p.setZ(i, (Math.pow(Math.abs(u), 6) + Math.pow(Math.abs(v), 8)) * 0.025);
	}
	mapGeo.computeVertexNormals();
	const mapMesh = new THREE.Mesh(mapGeo, new THREE.MeshStandardMaterial({ map: map.tex, roughness: 0.92, side: THREE.DoubleSide }));
	mapMesh.rotation.x = -Math.PI / 2;
	mapMesh.position.set(-0.1, topY + 0.035, 0);
	root.add(mapMesh);

	// map weights
	for (const [x, z] of [
		[-0.6, -0.31],
		[0.42, 0.31]
	]) {
		const w = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.05, 12), m.brass);
		w.position.set(x, topY + 0.06, z);
		root.add(w);
	}

	// compass: brass bowl, card, needle
	const compass = new THREE.Group();
	compass.position.set(0.52, topY + 0.035, -0.28);
	const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.05, 32), m.brass);
	bowl.position.y = 0.025;
	compass.add(bowl);
	const card = new THREE.Mesh(new THREE.CircleGeometry(0.095, 32), new THREE.MeshStandardMaterial({ map: compassTexture(), roughness: 0.6 }));
	card.rotation.x = -Math.PI / 2;
	card.position.y = 0.052;
	compass.add(card);
	const needle = new THREE.Group();
	needle.position.y = 0.058;
	const north = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.09, 4), new THREE.MeshStandardMaterial({ color: '#8a2a14', roughness: 0.5 }));
	north.rotation.x = -Math.PI / 2;
	north.position.z = -0.045;
	const south = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.09, 4), m.iron);
	south.rotation.x = Math.PI / 2;
	south.position.z = 0.045;
	const pin = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), m.brass);
	needle.add(north, south, pin);
	compass.add(needle);
	const glass = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), new THREE.MeshStandardMaterial({ color: '#9fd9d3', transparent: true, opacity: 0.12, metalness: 0.2, roughness: 0.05 }));
	glass.rotation.x = -Math.PI / 2;
	glass.position.y = 0.062;
	compass.add(glass);
	const lid = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.008, 6, 32), m.brass);
	lid.rotation.x = Math.PI / 2;
	lid.position.y = 0.064;
	compass.add(lid);
	root.add(compass);

	// telescope: three brass draws and a leather grip
	const scope = new THREE.Group();
	const draws = [
		[0.034, 0.03, 0.28, m.leather],
		[0.028, 0.026, 0.2, m.brass],
		[0.022, 0.02, 0.16, m.brass]
	];
	let off = 0;
	for (const [r0, r1, len, mat] of draws) {
		const tube = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 14), mat);
		tube.rotation.z = Math.PI / 2;
		tube.position.x = off + len / 2;
		scope.add(tube);
		const ring = new THREE.Mesh(new THREE.TorusGeometry(r0 + 0.002, 0.005, 6, 16), m.brass);
		ring.rotation.y = Math.PI / 2;
		ring.position.x = off;
		scope.add(ring);
		off += len - 0.02;
	}
	const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.04, 12), m.brass);
	eyepiece.rotation.z = Math.PI / 2;
	eyepiece.position.x = off + 0.02;
	scope.add(eyepiece);
	scope.position.set(-0.55, topY + 0.065, 0.36);
	scope.rotation.y = 0.35;
	root.add(scope);

	// the ship's logbook, open, with quill and inkwell
	const book = new THREE.Group();
	book.position.set(0.47, topY + 0.035, 0.2);
	book.rotation.y = -0.25;
	const cover = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.32), m.leather);
	book.add(cover);
	const pageGeo = new THREE.PlaneGeometry(0.22, 0.3, 8, 1);
	const pg = pageGeo.attributes.position;
	for (let i = 0; i < pg.count; i++) {
		const u = (pg.getX(i) + 0.11) / 0.22;
		pg.setZ(i, Math.sin(u * Math.PI) * 0.012 + (1 - u) * 0.0);
	}
	pageGeo.computeVertexNormals();
	const logTex = logbookTexture();
	for (const s of [-1, 1]) {
		const t = logTex.clone();
		t.needsUpdate = true;
		t.repeat.set(0.5, 1);
		t.offset.set(s < 0 ? 0 : 0.5, 0);
		const page = new THREE.Mesh(pageGeo, new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, side: THREE.DoubleSide }));
		page.rotation.x = -Math.PI / 2;
		page.rotation.y = s * 0.08;
		page.position.set(s * 0.112, 0.016, 0);
		book.add(page);
	}
	const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.12), new THREE.MeshStandardMaterial({ color: '#7a1e1e', side: THREE.DoubleSide }));
	ribbon.rotation.x = -Math.PI / 2 + 0.3;
	ribbon.position.set(0.0, 0.01, 0.2);
	book.add(ribbon);
	root.add(book);
	const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.05, 12), new THREE.MeshStandardMaterial({ color: '#0c1420', roughness: 0.2, metalness: 0.3 }));
	ink.position.set(0.18, topY + 0.06, 0.33);
	root.add(ink);
	const quill = new THREE.Group();
	const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.26, 6), new THREE.MeshStandardMaterial({ color: '#e8e0cc' }));
	quill.add(shaft);
	const vaneShape = new THREE.Shape();
	vaneShape.moveTo(0, -0.02);
	vaneShape.quadraticCurveTo(0.03, 0.06, 0.004, 0.13);
	vaneShape.quadraticCurveTo(-0.02, 0.06, 0, -0.02);
	const vane = new THREE.Mesh(new THREE.ShapeGeometry(vaneShape), new THREE.MeshStandardMaterial({ color: '#e9e3d4', side: THREE.DoubleSide, roughness: 0.9 }));
	vane.position.y = 0.0;
	quill.add(vane);
	quill.position.set(0.18, topY + 0.17, 0.33);
	quill.rotation.set(0.2, 0, -0.35);
	root.add(quill);

	// hanging-style lantern on a post at the table corner
	const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.7, 8), m.iron);
	post.position.set(-0.66, topY + 0.38, -0.42);
	root.add(post);
	const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), m.iron);
	arm.rotation.z = Math.PI / 2;
	arm.position.set(-0.52, topY + 0.72, -0.42);
	root.add(arm);
	const lantern = new THREE.Group();
	lantern.position.set(-0.4, topY + 0.6, -0.42);
	const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.17, 6, 1, true), m.brass);
	lantern.add(frame);
	const capL = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.07, 6), m.brass);
	capL.position.y = 0.12;
	lantern.add(capL);
	const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), m.glow);
	flame.scale.y = 1.5;
	lantern.add(flame);
	root.add(lantern);
	const light = new THREE.PointLight('#ffb15a', 0, 4.5, 1.6);
	light.position.set(-0.4, topY + 0.6, -0.42);
	root.add(light);

	/** chart pixel → table-local position on the map surface */
	const spotToLocal = (x, y) => new THREE.Vector3(-0.1 + (x / 1024 - 0.5) * mapW, topY + 0.04, (y / 704 - 0.5) * mapH);
	return { root, map, needle, compass, scope, book, light, flame, topY, spotToLocal };
}

/* ------------------------------------------------------------------ */
/* Treasure chest                                                       */
/* ------------------------------------------------------------------ */
export function makeChest(m) {
	const root = new THREE.Group();
	const w = 0.62,
		d = 0.4,
		h = 0.32;
	const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m.wood);
	body.position.y = h / 2;
	root.add(body);
	for (const x of [-w / 2 + 0.06, 0, w / 2 - 0.06]) {
		const band = new THREE.Mesh(new THREE.BoxGeometry(0.035, h + 0.01, d + 0.012), m.iron);
		band.position.set(x, h / 2, 0);
		root.add(band);
	}
	const lock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.02), m.brass);
	lock.position.set(0, h - 0.06, d / 2 + 0.01);
	root.add(lock);
	// treasure inside: glowing coins and a lit crystal
	const gold = new THREE.MeshStandardMaterial({ color: '#e0a83a', metalness: 1, roughness: 0.25, emissive: '#5a3a08', emissiveIntensity: 0.6 });
	const pile = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold);
	pile.scale.set(1.05, 0.35, 0.7);
	pile.position.y = h - 0.03;
	root.add(pile);
	const coinGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.006, 12);
	const coins = new THREE.InstancedMesh(coinGeo, gold, 18);
	const r = rng(9);
	const m4 = new THREE.Matrix4();
	for (let i = 0; i < 18; i++) {
		const e = new THREE.Euler(r() * 1.2, r() * 3, r() * 1.2);
		m4.compose(new THREE.Vector3((r() - 0.5) * 0.45, h + 0.03 + r() * 0.05, (r() - 0.5) * 0.25), new THREE.Quaternion().setFromEuler(e), new THREE.Vector3(1, 1, 1));
		coins.setMatrixAt(i, m4);
	}
	root.add(coins);
	const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), m.teal);
	crystal.position.set(0.08, h + 0.1, 0);
	root.add(crystal);
	// lid hinged at the back edge
	const hinge = new THREE.Group();
	hinge.position.set(0, h, -d / 2);
	const lidGeo = new THREE.CylinderGeometry(d / 2, d / 2, w, 20, 1, false, 0, Math.PI);
	lidGeo.rotateZ(Math.PI / 2);
	lidGeo.rotateX(-Math.PI / 2);
	const lid = new THREE.Mesh(lidGeo, m.wood);
	lid.position.z = d / 2;
	lid.rotation.x = Math.PI / 2;
	hinge.add(lid);
	for (const x of [-w / 2 + 0.06, 0, w / 2 - 0.06]) {
		const bGeo = new THREE.TorusGeometry(d / 2 + 0.006, 0.016, 6, 20, Math.PI);
		const band = new THREE.Mesh(bGeo, m.iron);
		band.rotation.y = Math.PI / 2;
		band.position.set(x, 0, d / 2);
		hinge.add(band);
	}
	root.add(hinge);
	const light = new THREE.PointLight('#ffc25a', 0, 3.2, 1.8);
	light.position.set(0, h + 0.25, 0);
	root.add(light);
	return { root, hinge, light, crystal };
}
