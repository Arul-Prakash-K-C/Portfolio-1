// @ts-nocheck — three ships no bundled types; this file is checked by running it.
/**
 * "The Night Compiler": an original, procedurally built galleon.
 *
 * Generic age-of-sail anatomy (lofted hull, stern castle, three masts,
 * square rig, rigging), with an identity of its own: weathered umber wood,
 * brass trim, ash-grey patched canvas and a compass-and-gear pennant.
 * The captain is a high-detail transparent character render animated from
 * a consistent five-pose sheet.
 */
import * as THREE from 'three';
import { makePirateSprite } from './pirateSprite.js';

/* ------------------------------------------------------------------ */
/* Seeded random so the ship looks the same on every visit             */
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

/* ------------------------------------------------------------------ */
/* Procedural canvas textures                                          */
/* ------------------------------------------------------------------ */
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d'), w, h);
	const t = new THREE.CanvasTexture(c);
	if (srgb) t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(repeat[0], repeat[1]);
	t.anisotropy = 4;
	return t;
}

function grain(ctx, w, h, r, amount, alpha) {
	for (let i = 0; i < amount; i++) {
		const v = Math.floor(r() * 255);
		ctx.fillStyle = `rgba(${v},${v * 0.8},${v * 0.6},${alpha * r()})`;
		ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1);
	}
}

/** Horizontal planking for the hull: u runs along the ship, v runs down the side. */
function hullTexture() {
	const r = rng(11);
	return canvasTex(
		1024,
		256,
		(ctx, w, h) => {
			ctx.fillStyle = '#2c1d13';
			ctx.fillRect(0, 0, w, h);
			const rows = 16;
			for (let i = 0; i < rows; i++) {
				const y = (i / rows) * h;
				// plank courses with butt joints at staggered offsets
				let x = -r() * 120;
				while (x < w) {
					const len = 140 + r() * 160;
					const l = 22 + r() * 16;
					ctx.fillStyle = `hsl(24, ${28 + r() * 14}%, ${l * 0.55}%)`;
					ctx.fillRect(x, y + 1, len - 2, h / rows - 2);
					x += len;
				}
				ctx.fillStyle = 'rgba(8,4,2,0.85)';
				ctx.fillRect(0, y, w, 1.5);
			}
			grain(ctx, w, h, r, 9000, 0.18);
			// salt and weathering streaks down from the waterline
			for (let i = 0; i < 70; i++) {
				const x = r() * w;
				const g = ctx.createLinearGradient(0, h * 0.4, 0, h);
				g.addColorStop(0, 'rgba(160,150,130,0)');
				g.addColorStop(1, `rgba(160,150,130,${0.05 + r() * 0.08})`);
				ctx.fillStyle = g;
				ctx.fillRect(x, h * 0.4, 2 + r() * 6, h * 0.6);
			}
			// dark tar band at the waterline
			const wl = ctx.createLinearGradient(0, h * 0.62, 0, h);
			wl.addColorStop(0, 'rgba(10,8,6,0)');
			wl.addColorStop(0.25, 'rgba(10,8,6,0.75)');
			wl.addColorStop(1, 'rgba(18,22,20,0.9)');
			ctx.fillStyle = wl;
			ctx.fillRect(0, h * 0.62, w, h * 0.38);
		},
		{ repeat: [3, 1] }
	);
}

function deckTexture() {
	const r = rng(23);
	return canvasTex(
		512,
		512,
		(ctx, w, h) => {
			ctx.fillStyle = '#4a3523';
			ctx.fillRect(0, 0, w, h);
			const n = 24;
			for (let i = 0; i < n; i++) {
				const y = (i / n) * h;
				ctx.fillStyle = `hsl(28, 30%, ${18 + r() * 9}%)`;
				ctx.fillRect(0, y + 1, w, h / n - 2);
				ctx.fillStyle = 'rgba(0,0,0,.6)';
				ctx.fillRect(0, y, w, 1);
				for (let k = 0; k < 3; k++) {
					ctx.fillStyle = 'rgba(0,0,0,.5)';
					ctx.fillRect(r() * w, y + 2, 1, h / n - 4);
				}
			}
			grain(ctx, w, h, r, 5000, 0.15);
		},
		{ repeat: [4, 1] }
	);
}

/** Weathered canvas with seams, patches and grime. */
function sailTexture(seed) {
	const r = rng(seed);
	return canvasTex(256, 256, (ctx, w, h) => {
		const g = ctx.createLinearGradient(0, 0, 0, h);
		g.addColorStop(0, '#b9b2a3');
		g.addColorStop(1, '#8f877a');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
		// vertical cloths
		for (let x = 0; x < w; x += 21) {
			ctx.fillStyle = 'rgba(60,50,40,.35)';
			ctx.fillRect(x, 0, 1.5, h);
		}
		// reef band
		ctx.fillStyle = 'rgba(70,60,48,.35)';
		ctx.fillRect(0, h * 0.18, w, 3);
		// patches
		for (let i = 0; i < 5; i++) {
			const pw = 18 + r() * 34,
				ph = 14 + r() * 28;
			ctx.fillStyle = `rgba(${120 + r() * 40},${110 + r() * 30},${90 + r() * 20},.75)`;
			const px = r() * (w - pw),
				py = r() * (h - ph);
			ctx.fillRect(px, py, pw, ph);
			ctx.strokeStyle = 'rgba(50,40,30,.5)';
			ctx.setLineDash([2, 2]);
			ctx.strokeRect(px, py, pw, ph);
		}
		ctx.setLineDash([]);
		// grime and water stains
		for (let i = 0; i < 26; i++) {
			const x = r() * w,
				y = r() * h,
				rad = 6 + r() * 40;
			const s = ctx.createRadialGradient(x, y, 0, x, y, rad);
			s.addColorStop(0, `rgba(40,32,24,${0.08 + r() * 0.18})`);
			s.addColorStop(1, 'rgba(40,32,24,0)');
			ctx.fillStyle = s;
			ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
		}
		grain(ctx, w, h, r, 3000, 0.12);
	});
}

/** Alpha map: ragged foot, frayed leeches and a few holes. White = cloth. */
function tatterAlpha(seed, severity) {
	const r = rng(seed);
	return canvasTex(
		256,
		256,
		(ctx, w, h) => {
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, w, h);
			ctx.fillStyle = '#000';
			// ragged foot
			ctx.beginPath();
			ctx.moveTo(0, h);
			let x = 0;
			while (x <= w) {
				const depth = (0.03 + r() * 0.1 + (r() < 0.18 ? r() * 0.22 * severity : 0)) * h;
				ctx.lineTo(x, h - depth);
				x += 4 + r() * 10;
			}
			ctx.lineTo(w, h);
			ctx.closePath();
			ctx.fill();
			// frayed sides
			for (const side of [0, 1]) {
				ctx.beginPath();
				ctx.moveTo(side ? w : 0, 0);
				let y = 0;
				while (y <= h) {
					const d = (0.005 + r() * 0.025 * severity) * w;
					ctx.lineTo(side ? w - d : d, y);
					y += 6 + r() * 12;
				}
				ctx.lineTo(side ? w : 0, h);
				ctx.fill();
			}
			// tears and holes
			const holes = Math.round(2 + severity * 5);
			for (let i = 0; i < holes; i++) {
				const cx = 30 + r() * (w - 60),
					cy = 40 + r() * (h - 80);
				ctx.beginPath();
				const pts = 9;
				for (let k = 0; k < pts; k++) {
					const a = (k / pts) * Math.PI * 2;
					const rad = (3 + r() * 10 * severity) * (k % 2 ? 0.5 : 1);
					ctx.lineTo(cx + Math.cos(a) * rad * 1.4, cy + Math.sin(a) * rad);
				}
				ctx.closePath();
				ctx.fill();
			}
			// one long vertical rip on badly torn sails
			if (severity > 0.7) {
				ctx.beginPath();
				const rx = w * (0.3 + r() * 0.4);
				ctx.moveTo(rx, h);
				let ry = h;
				let cx = rx;
				while (ry > h * 0.55) {
					ry -= 8;
					cx += (r() - 0.5) * 6;
					ctx.lineTo(cx + 3, ry);
				}
				ctx.lineTo(cx - 3, ry);
				ctx.lineTo(rx - 6, h);
				ctx.fill();
			}
		},
		{ srgb: false }
	);
}

/** Compass-and-gear pennant: an original emblem. */
function pennantTexture() {
	return canvasTex(256, 128, (ctx, w, h) => {
		ctx.fillStyle = '#10161f';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#d9a84e';
		const cx = 70,
			cy = 64;
		// gear
		ctx.beginPath();
		for (let i = 0; i < 24; i++) {
			const a = (i / 24) * Math.PI * 2;
			const rad = i % 2 ? 34 : 40;
			ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
		}
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = '#10161f';
		ctx.beginPath();
		ctx.arc(cx, cy, 26, 0, Math.PI * 2);
		ctx.fill();
		// compass needle
		ctx.fillStyle = '#efe4cc';
		ctx.beginPath();
		ctx.moveTo(cx, cy - 24);
		ctx.lineTo(cx + 6, cy);
		ctx.lineTo(cx, cy + 24);
		ctx.lineTo(cx - 6, cy);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = '#5ad6c9';
		ctx.beginPath();
		ctx.arc(cx, cy, 5, 0, Math.PI * 2);
		ctx.fill();
		// code brackets
		ctx.fillStyle = '#d9a84e';
		ctx.font = 'bold 54px monospace';
		ctx.fillText('</>', 128, 82);
	});
}

/* ------------------------------------------------------------------ */
/* Hull                                                                */
/* ------------------------------------------------------------------ */
const L = 12; // length on deck
const W = 1.75; // half-beam
const STATIONS = 64;
const SECT = 22;

/** half-beam along the length (t: 0 stern → 1 bow) */
function beam(t) {
	if (t < 0.14) return W * (0.74 + 0.26 * Math.sin((t / 0.14) * Math.PI * 0.5));
	if (t > 0.56) return W * Math.pow(Math.cos(((t - 0.56) / 0.44) * Math.PI * 0.5), 0.72);
	return W;
}
/** rail height: tall stern castle, raised forecastle */
function sheer(t) {
	const stern = Math.pow(Math.max(0, 1 - t / 0.3), 1.6) * 1.55;
	const bow = Math.pow(Math.max(0, (t - 0.74) / 0.26), 2) * 0.75;
	return 1.05 + stern + bow;
}
/** depth of keel below the waterline */
function depth(t) {
	const bow = t > 0.72 ? 1 - Math.pow((t - 0.72) / 0.28, 1.7) * 0.8 : 1;
	const stern = t < 0.06 ? 0.75 + 0.25 * (t / 0.06) : 1;
	return 1.35 * bow * stern;
}
/** cross-section half-width factor, v: 0 rail → 1 keel */
function section(v, t) {
	const body = Math.sqrt(Math.max(0, 1 - Math.pow(v, 2.3)));
	const tumble = 1 - 0.14 * Math.pow(Math.max(0, 0.32 - v) / 0.32, 1.4) * (t < 0.3 ? 1.3 : 1);
	return Math.max(body * tumble, 0.035);
}
/** stem rake: lower bow points sweep aft */
function rake(v, t) {
	const k = Math.max(0, (t - 0.7) / 0.3);
	return -Math.pow(v, 1.6) * k * k * 1.6;
}

export function hullPoint(t, v, side) {
	const x = -L / 2 + t * L + rake(v, t);
	const top = sheer(t);
	const y = top - (top + depth(t)) * v;
	const z = side * beam(t) * section(v, t);
	return new THREE.Vector3(x, y, z);
}

function makeHullGeometry() {
	const pos = [];
	const uv = [];
	const idx = [];
	for (const side of [-1, 1]) {
		const base = pos.length / 3;
		for (let i = 0; i <= STATIONS; i++) {
			const t = i / STATIONS;
			for (let j = 0; j <= SECT; j++) {
				const v = j / SECT;
				const p = hullPoint(t, v, side);
				pos.push(p.x, p.y, p.z);
				uv.push(t, 1 - v);
			}
		}
		for (let i = 0; i < STATIONS; i++) {
			for (let j = 0; j < SECT; j++) {
				const a = base + i * (SECT + 1) + j;
				const b = a + SECT + 1;
				if (side > 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
				else idx.push(a, a + 1, b, b, a + 1, b + 1);
			}
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
}

/** Flat transom across the stern, cut from the stern station outline. */
function makeTransom() {
	const shape = new THREE.Shape();
	const pts = [];
	for (let j = 0; j <= SECT; j++) pts.push(hullPoint(0, j / SECT, -1));
	for (let j = SECT; j >= 0; j--) pts.push(hullPoint(0, j / SECT, 1));
	shape.moveTo(pts[0].z, pts[0].y);
	for (const p of pts.slice(1)) shape.lineTo(p.z, p.y);
	const g = new THREE.ShapeGeometry(shape);
	const a = g.attributes.position;
	for (let i = 0; i < a.count; i++) {
		const zz = a.getX(i),
			yy = a.getY(i);
		a.setXYZ(i, -L / 2 - 0.001, yy, zz);
	}
	g.computeVertexNormals();
	return g;
}

function makeDeck(level) {
	// a walkable deck surface following the inside of the bulwarks
	const pos = [];
	const uv = [];
	const idx = [];
	const n = 40;
	for (let i = 0; i <= n; i++) {
		const t = 0.01 + (i / n) * 0.97;
		const y = level(t);
		// find the hull half-width at this height
		const top = sheer(t);
		const v = Math.min(Math.max((top - y) / (top + depth(t)), 0), 1);
		const z = beam(t) * section(v, t) - 0.08;
		const x = -L / 2 + t * L + rake(v, t);
		pos.push(x, y, -z, x, y, z);
		uv.push(t, 0, t, 1);
	}
	for (let i = 0; i < n; i++) {
		const a = i * 2;
		idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
}

/** Tube that follows the hull at a fixed section height: wales, rails, trim. */
function hullLine(v, side, t0, t1, radius, mat) {
	const pts = [];
	for (let i = 0; i <= 40; i++) {
		const t = t0 + (i / 40) * (t1 - t0);
		const p = hullPoint(t, v, side);
		p.z += side * 0.02;
		pts.push(p);
	}
	const curve = new THREE.CatmullRomCurve3(pts);
	return new THREE.Mesh(new THREE.TubeGeometry(curve, 80, radius, 6, false), mat);
}

/* ------------------------------------------------------------------ */
/* Sails                                                               */
/* ------------------------------------------------------------------ */
function squareSail(wTop, wBottom, h, belly, mat) {
	const g = new THREE.PlaneGeometry(1, 1, 18, 14);
	const p = g.attributes.position;
	for (let i = 0; i < p.count; i++) {
		const u = p.getX(i) + 0.5; // 0..1 across
		const v = p.getY(i) + 0.5; // 0 foot .. 1 head
		const w = wBottom + (wTop - wBottom) * v;
		const z = (u - 0.5) * w;
		const y = (v - 1) * h; // hangs below the yard
		const across = 1 - Math.pow((u - 0.5) * 2, 2);
		const down = Math.sin(Math.PI * Math.min(1, (1 - v) * 0.95 + 0.05));
		const x = belly * across * (0.35 + 0.65 * down);
		p.setXYZ(i, x, y, z);
	}
	g.computeVertexNormals();
	const m = new THREE.Mesh(g, mat);
	return m;
}

/* ------------------------------------------------------------------ */
/* Figurehead: a brass automaton with swept fins                       */
/* ------------------------------------------------------------------ */
function makeFigurehead(brass, teal) {
	const g = new THREE.Group();
	const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 4, 10), brass);
	torso.rotation.z = -1.0;
	g.add(torso);
	const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.24), brass);
	head.position.set(0.36, 0.26, 0);
	head.rotation.z = -0.4;
	g.add(head);
	const visor = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.18), teal);
	visor.position.set(0.49, 0.25, 0);
	visor.rotation.z = -0.4;
	g.add(visor);
	const finShape = new THREE.Shape();
	finShape.moveTo(0, 0);
	finShape.quadraticCurveTo(-0.6, 0.35, -1.1, 0.15);
	finShape.quadraticCurveTo(-0.6, 0.05, 0, -0.12);
	const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.02, bevelEnabled: false });
	for (const s of [-1, 1]) {
		const fin = new THREE.Mesh(finGeo, brass);
		fin.position.set(0.05, 0.05, s * 0.17);
		fin.rotation.y = s * 0.35;
		g.add(fin);
	}
	return g;
}

/* ------------------------------------------------------------------ */
/* Assemble                                                            */
/* ------------------------------------------------------------------ */
export function makeGalleon() {
	const ship = new THREE.Group();
	const r = rng(77);

	const hullMap = hullTexture();
	const hullMat = new THREE.MeshStandardMaterial({
		map: hullMap,
		roughness: 0.82,
		metalness: 0.05,
		side: THREE.DoubleSide
	});
	const darkWood = new THREE.MeshStandardMaterial({ color: '#2a1b11', roughness: 0.85 });
	const spar = new THREE.MeshStandardMaterial({ color: '#3b2817', roughness: 0.8 });
	const deckMat = new THREE.MeshStandardMaterial({ map: deckTexture(), roughness: 0.9 });
	const brass = new THREE.MeshStandardMaterial({ color: '#c8913c', metalness: 0.9, roughness: 0.38 });
	const iron = new THREE.MeshStandardMaterial({ color: '#15171a', metalness: 0.7, roughness: 0.5 });
	const teal = new THREE.MeshBasicMaterial({ color: '#5ad6c9', toneMapped: false });
	const windowMat = new THREE.MeshBasicMaterial({ color: '#ffb455', toneMapped: false });
	const windowDim = new THREE.MeshBasicMaterial({ color: '#a8642a', toneMapped: false });

	/* hull, transom, decks */
	ship.add(new THREE.Mesh(makeHullGeometry(), hullMat));
	ship.add(new THREE.Mesh(makeTransom(), darkWood));
	const mainDeck = (t) => Math.min(sheer(t), 1.05) - 0.55 + (t > 0.74 ? Math.pow((t - 0.74) / 0.26, 2) * 0.55 : 0);
	ship.add(new THREE.Mesh(makeDeck(mainDeck), deckMat));
	// quarterdeck and poop deck stepping up toward the stern
	const qd = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 2.9), deckMat);
	qd.position.set(-L / 2 + 1.75, 1.25, 0);
	ship.add(qd);
	const poop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 2.4), deckMat);
	poop.position.set(-L / 2 + 0.85, 1.95, 0);
	ship.add(poop);
	// bulkhead below the quarterdeck, with lit doors
	const bulk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 2.9), darkWood);
	bulk.position.set(-L / 2 + 3.05, 0.88, 0);
	ship.add(bulk);
	for (const z of [-0.7, 0.7]) {
		const door = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.5), windowDim);
		door.position.set(-L / 2 + 3.1, 0.8, z);
		door.rotation.y = Math.PI / 2;
		ship.add(door);
	}

	/* wales, rails and brass trim */
	for (const side of [-1, 1]) {
		ship.add(hullLine(0.02, side, 0.0, 0.985, 0.045, darkWood)); // cap rail
		ship.add(hullLine(0.2, side, 0.02, 0.95, 0.035, brass));
		ship.add(hullLine(0.31, side, 0.02, 0.93, 0.05, darkWood)); // main wale
		ship.add(hullLine(0.36, side, 0.03, 0.92, 0.02, brass));
		ship.add(hullLine(0.5, side, 0.05, 0.9, 0.04, darkWood)); // lower wale
	}

	/* gunports with cannons: instanced */
	const portGeo = new THREE.BoxGeometry(0.34, 0.3, 0.05);
	const portFrameGeo = new THREE.BoxGeometry(0.42, 0.38, 0.03);
	const gunGeo = new THREE.CylinderGeometry(0.06, 0.075, 0.5, 10);
	gunGeo.rotateX(Math.PI / 2);
	const portT = [];
	for (let i = 0; i < 8; i++) portT.push(0.24 + i * 0.065);
	const nPorts = portT.length * 2;
	const ports = new THREE.InstancedMesh(portGeo, new THREE.MeshBasicMaterial({ color: '#070504' }), nPorts);
	const frames = new THREE.InstancedMesh(portFrameGeo, brass, nPorts);
	const guns = new THREE.InstancedMesh(gunGeo, iron, nPorts);
	const m4 = new THREE.Matrix4();
	const q = new THREE.Quaternion();
	const e = new THREE.Euler();
	let k = 0;
	for (const side of [-1, 1]) {
		for (const t of portT) {
			const p = hullPoint(t, 0.26, side);
			const p2 = hullPoint(t + 0.01, 0.26, side);
			const yaw = Math.atan2(p2.z - p.z, p2.x - p.x);
			e.set(0, -yaw, 0);
			q.setFromEuler(e);
			const out = new THREE.Vector3(0, 0, side * 0.03);
			m4.compose(p.clone().add(out), q, new THREE.Vector3(1, 1, 1));
			frames.setMatrixAt(k, m4);
			m4.compose(p.clone().add(out.clone().multiplyScalar(1.6)), q, new THREE.Vector3(1, 1, 1));
			ports.setMatrixAt(k, m4);
			m4.compose(p.clone().add(new THREE.Vector3(0, -0.02, side * 0.22)), q, new THREE.Vector3(1, 1, 1));
			guns.setMatrixAt(k, m4);
			k++;
		}
	}
	ship.add(frames, ports, guns);

	/* stern: gallery windows, balcony, quarter galleries, carvings */
	const sternX = -L / 2 - 0.02;
	const rows = [
		{ y: 2.15, n: 5, w: 0.26, h: 0.32 },
		{ y: 1.55, n: 6, w: 0.24, h: 0.3 }
	];
	for (const row of rows) {
		const half = beam(0) * section((sheer(0) - row.y) / (sheer(0) + depth(0)), 0) * 0.82;
		for (let i = 0; i < row.n; i++) {
			const z = -half + ((i + 0.5) / row.n) * half * 2;
			const lit = r() > 0.2;
			const win = new THREE.Mesh(new THREE.PlaneGeometry(row.w, row.h), lit ? windowMat : windowDim);
			win.position.set(sternX - 0.01, row.y, z);
			win.rotation.y = -Math.PI / 2;
			ship.add(win);
			const mull = new THREE.Mesh(new THREE.BoxGeometry(0.03, row.h + 0.08, row.w + 0.08), brass);
			mull.position.set(sternX + 0.0, row.y, z);
			ship.add(mull);
		}
		// balcony under each row of windows
		const bal = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, half * 2 + 0.2), darkWood);
		bal.position.set(sternX - 0.14, row.y - row.h / 2 - 0.08, 0);
		ship.add(bal);
		const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, half * 2 + 0.2), brass);
		rail.position.set(sternX - 0.27, row.y - row.h / 2 + 0.14, 0);
		ship.add(rail);
		const balGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 5);
		const nb = 16;
		const balusters = new THREE.InstancedMesh(balGeo, brass, nb);
		for (let i = 0; i < nb; i++) {
			m4.makeTranslation(sternX - 0.27, row.y - row.h / 2 + 0.03, -half - 0.1 + (i / (nb - 1)) * (half * 2 + 0.2));
			balusters.setMatrixAt(i, m4);
		}
		ship.add(balusters);
	}
	// taffrail crest
	const crest = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24, Math.PI), brass);
	crest.position.set(sternX, sheer(0) + 0.05, 0);
	crest.rotation.y = Math.PI / 2;
	ship.add(crest);
	// quarter galleries on both sides near the stern
	for (const side of [-1, 1]) {
		const p = hullPoint(0.08, 0.18, side);
		const qg = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.3), darkWood);
		qg.position.set(p.x, p.y + 0.1, p.z + side * 0.12);
		ship.add(qg);
		for (let i = 0; i < 3; i++) {
			const w = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), windowMat);
			w.position.set(p.x - 0.28 + i * 0.28, p.y + 0.14, p.z + side * 0.28);
			if (side < 0) w.rotation.y = Math.PI;
			ship.add(w);
		}
		const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass);
		cap.scale.set(1.5, 0.6, 0.6);
		cap.position.set(p.x, p.y + 0.45, p.z + side * 0.12);
		ship.add(cap);
	}

	/* stern lanterns */
	const lanternGlass = new THREE.MeshBasicMaterial({ color: '#ffcf7a', toneMapped: false });
	const lanterns = [];
	for (const z of [-0.9, 0, 0.9]) {
		const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), iron);
		pole.position.set(sternX + 0.15, sheer(0) + 0.3, z);
		ship.add(pole);
		const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.28, 6, 1, true), brass);
		cage.position.set(sternX + 0.15, sheer(0) + 0.65, z);
		ship.add(cage);
		const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), lanternGlass);
		glow.position.copy(cage.position);
		ship.add(glow);
		lanterns.push(glow);
	}
	const lanternLight = new THREE.PointLight('#ffb050', 9, 12, 1.5);
	lanternLight.position.set(sternX + 0.3, sheer(0) + 0.7, 0);
	ship.add(lanternLight);
	const cabinLight = new THREE.PointLight('#ff9a3c', 4, 5, 2);
	cabinLight.position.set(sternX - 0.8, 1.8, 0);
	ship.add(cabinLight);

	/* bow: beakhead, bowsprit, jib-boom, figurehead */
	const bowTip = hullPoint(1, 0.05, 1);
	const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 5.2, 10), spar);
	bowsprit.position.set(bowTip.x + 1.9, sheer(1) + 0.55, 0);
	bowsprit.rotation.z = -Math.PI / 2 + 0.32;
	ship.add(bowsprit);
	const spritTip = new THREE.Vector3(bowTip.x + 4.35, sheer(1) + 1.35, 0);
	const head = makeFigurehead(brass, teal);
	head.position.set(bowTip.x + 0.35, sheer(1) - 0.35, 0);
	head.scale.setScalar(1.1);
	ship.add(head);
	const beak = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 8), darkWood);
	beak.rotation.z = -Math.PI / 2 + 0.25;
	beak.position.set(bowTip.x + 0.3, sheer(1) - 0.7, 0);
	ship.add(beak);
	// cathead anchors
	for (const side of [-1, 1]) {
		const p = hullPoint(0.86, 0.12, side);
		const anchor = new THREE.Group();
		const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), iron);
		const arms = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 6, 12, Math.PI), iron);
		arms.rotation.z = Math.PI;
		arms.position.y = -0.45;
		anchor.add(shank, arms);
		anchor.position.set(p.x, p.y - 0.4, p.z + side * 0.1);
		anchor.rotation.x = side * 0.15;
		ship.add(anchor);
	}

	/* masts, tops, yards and sails */
	const deckY = 0.5;
	const mastsDef = [
		{ x: 3.4, h: 11.2, yards: [6.0, 4.9, 3.5], sev: [0.95, 0.6, 0.4] },
		{ x: 0.2, h: 12.6, yards: [6.8, 5.6, 4.0], sev: [0.8, 0.45, 0.55] },
		{ x: -3.2, h: 9.2, yards: [4.6, 3.4], sev: [0.5, 0.35], spanker: true }
	];
	const sailTex = [sailTexture(1), sailTexture(2), sailTexture(3)];
	const sails = [];
	const mastTops = [];
	const rigPts = []; // pairs of points for LineSegments
	const seg = (a, b) => rigPts.push(a.x, a.y, a.z, b.x, b.y, b.z);
	let sailSeed = 100;

	for (const [mi, m] of mastsDef.entries()) {
		const lowerH = m.h * 0.52;
		const topH = m.h * 0.3;
		const tgH = m.h * 0.22;
		const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, lowerH, 12), spar);
		lower.position.set(m.x, deckY + lowerH / 2, 0);
		ship.add(lower);
		const topY = deckY + lowerH;
		const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.08, 16), darkWood);
		top.position.set(m.x, topY - 0.15, 0);
		ship.add(top);
		const topmast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, topH, 10), spar);
		topmast.position.set(m.x, topY - 0.2 + topH / 2, 0);
		ship.add(topmast);
		const crossY = topY - 0.2 + topH;
		const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.2), darkWood);
		cross.position.set(m.x, crossY - 0.1, 0);
		ship.add(cross);
		const tg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, tgH, 8), spar);
		tg.position.set(m.x, crossY - 0.15 + tgH / 2, 0);
		ship.add(tg);
		const headY = crossY - 0.15 + tgH;
		const truck = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), brass);
		truck.position.set(m.x, headY, 0);
		ship.add(truck);
		mastTops.push({ x: m.x, topY, crossY, headY });

		// yard heights: course at ~0.42 of lower, topsail near the top, topgallant above the crosstrees
		const yardY = [deckY + lowerH * 0.9, topY - 0.2 + topH * 0.9, crossY - 0.15 + tgH * 0.85].slice(0, m.yards.length);
		const footY = [deckY + 1.9, topY - 0.05, crossY + 0.05];
		const brace = 0.32 + mi * 0.04;
		for (let yi = 0; yi < m.yards.length; yi++) {
			const len = m.yards[yi];
			const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, len, 8), spar);
			yard.rotation.x = Math.PI / 2;
			const yardG = new THREE.Group();
			yardG.add(yard);
			yardG.position.set(m.x + 0.12, yardY[yi], 0);
			yardG.rotation.y = brace;
			ship.add(yardG);
			// yard-arm rigging
			const arm = new THREE.Vector3(0, 0, len / 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), brace);
			for (const s of [-1, 1]) {
				const tipP = new THREE.Vector3(m.x + 0.12 + arm.x * s, yardY[yi], arm.z * s);
				seg(tipP, new THREE.Vector3(m.x, yardY[yi] + 0.9, 0)); // lifts
			}
			// the sail
			const h = yardY[yi] - footY[yi];
			const mat = new THREE.MeshStandardMaterial({
				map: sailTex[(mi + yi) % 3],
				alphaMap: tatterAlpha(sailSeed++, m.sev[yi]),
				alphaTest: 0.5,
				side: THREE.DoubleSide,
				roughness: 0.95,
				color: '#b9b4a8',
				emissive: '#3a3a3c',
				emissiveIntensity: 0.5
			});
			const sail = squareSail(len * 0.94, len * (yi === 0 ? 1.04 : 0.98), h, 0.55 + 0.1 * yi, mat);
			sail.position.set(0.05, 0, 0);
			yardG.add(sail);
			sails.push(sail);
		}

		if (m.spanker) {
			// gaff-rigged spanker aft of the mizzen
			const gaffLen = 3.2;
			const gaff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, gaffLen, 8), spar);
			gaff.rotation.z = Math.PI / 2 - 0.45;
			gaff.position.set(m.x - gaffLen * 0.45, deckY + lowerH * 0.95, 0);
			ship.add(gaff);
			const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 3.6, 8), spar);
			boom.rotation.z = Math.PI / 2;
			boom.position.set(m.x - 1.8, deckY + 1.75, 0);
			ship.add(boom);
			const shape = new THREE.Shape();
			shape.moveTo(0, deckY + 1.8);
			shape.lineTo(0, deckY + lowerH * 0.92);
			shape.lineTo(-gaffLen * 0.88, deckY + lowerH * 0.92 + gaffLen * 0.4);
			shape.lineTo(-3.5, deckY + 1.8);
			shape.closePath();
			const sg = new THREE.ShapeGeometry(shape, 12);
			const uvA = sg.attributes.uv;
			const pA = sg.attributes.position;
			for (let i = 0; i < pA.count; i++) {
				uvA.setXY(i, -pA.getX(i) / 3.5, (pA.getY(i) - deckY - 1.8) / (lowerH * 0.9));
				pA.setZ(i, Math.sin((-pA.getX(i) / 3.5) * Math.PI) * 0.35);
			}
			sg.computeVertexNormals();
			const spanker = new THREE.Mesh(
				sg,
				new THREE.MeshStandardMaterial({
					map: sailTex[2],
					alphaMap: tatterAlpha(sailSeed++, 0.6),
					alphaTest: 0.5,
					side: THREE.DoubleSide,
					roughness: 0.95,
					color: '#b9b4a8',
					emissive: '#3a3a3c',
					emissiveIntensity: 0.5
				})
			);
			spanker.position.x = m.x - 0.1;
			ship.add(spanker);
			sails.push(spanker);
		}

		// shrouds + ratlines down to the channels on each side
		const nShroud = 4;
		for (const side of [-1, 1]) {
			const anchors = [];
			for (let s = 0; s < nShroud; s++) {
				const tt = (m.x + L / 2) / L - 0.025 - s * 0.018;
				const p = hullPoint(Math.min(Math.max(tt, 0.02), 0.97), 0.08, side);
				p.z += side * 0.18;
				anchors.push(p);
				seg(p, new THREE.Vector3(m.x, topY - 0.2, side * 0.25));
			}
			// ratlines
			const top = new THREE.Vector3(m.x, topY - 0.2, side * 0.25);
			for (let h = 0.4; h < 0.92; h += 0.08) {
				for (let s = 0; s < nShroud - 1; s++) {
					const a = anchors[s].clone().lerp(top, h);
					const b = anchors[s + 1].clone().lerp(top, h);
					seg(a, b);
				}
			}
			// topmast shrouds from crosstrees to the top platform rim
			seg(new THREE.Vector3(m.x, crossY - 0.1, side * 0.5), new THREE.Vector3(m.x - 0.1, topY - 0.15, side * 0.6));
			seg(new THREE.Vector3(m.x, crossY - 0.1, side * 0.15), new THREE.Vector3(m.x + 0.2, topY - 0.15, side * 0.6));
			// backstays from the masthead to the hull aft
			const bs = hullPoint(Math.max((m.x + L / 2) / L - 0.12, 0.02), 0.06, side);
			bs.z += side * 0.15;
			seg(new THREE.Vector3(m.x, headY - 0.1, 0), bs);
		}
	}

	// stays between mastheads, and forestays down to the bowsprit
	const [fore, main, miz] = mastTops;
	seg(new THREE.Vector3(fore.x, fore.topY - 0.1, 0), new THREE.Vector3(bowTip.x + 1.0, sheer(1) + 0.75, 0));
	seg(new THREE.Vector3(fore.x, fore.crossY, 0), new THREE.Vector3(bowTip.x + 2.6, sheer(1) + 1.05, 0));
	seg(new THREE.Vector3(fore.x, fore.headY - 0.1, 0), spritTip);
	seg(new THREE.Vector3(main.x, main.topY - 0.1, 0), new THREE.Vector3(fore.x, deckY + 0.6, 0));
	seg(new THREE.Vector3(main.x, main.crossY, 0), new THREE.Vector3(fore.x, fore.topY - 0.2, 0));
	seg(new THREE.Vector3(main.x, main.headY - 0.1, 0), new THREE.Vector3(fore.x, fore.crossY, 0));
	seg(new THREE.Vector3(miz.x, miz.topY - 0.1, 0), new THREE.Vector3(main.x, deckY + 0.6, 0));
	seg(new THREE.Vector3(miz.x, miz.headY - 0.1, 0), new THREE.Vector3(main.x, main.topY - 0.2, 0));
	// martingale under the bowsprit
	seg(spritTip, new THREE.Vector3(bowTip.x + 0.8, sheer(1) - 0.6, 0));

	// jibs: triangular headsails on the forestays
	const jibMat = new THREE.MeshStandardMaterial({
		map: sailTex[1],
		alphaMap: tatterAlpha(sailSeed++, 0.5),
		alphaTest: 0.5,
		side: THREE.DoubleSide,
		roughness: 0.95,
		color: '#b9b4a8',
		emissive: '#3a3a3c',
		emissiveIntensity: 0.5
	});
	for (const [a, b, c] of [
		[new THREE.Vector3(fore.x + 0.2, fore.crossY - 0.4, 0), new THREE.Vector3(bowTip.x + 2.5, sheer(1) + 1.05, 0), new THREE.Vector3(bowTip.x + 0.6, sheer(1) + 0.75, 0)],
		[new THREE.Vector3(fore.x + 0.2, fore.headY - 0.6, 0), new THREE.Vector3(spritTip.x - 0.15, spritTip.y - 0.05, 0), new THREE.Vector3(bowTip.x + 2.3, sheer(1) + 1.15, 0)]
	]) {
		const g = new THREE.BufferGeometry();
		const steps = 8;
		const pos = [];
		const uv = [];
		const idx = [];
		// subdivided triangle so it can belly out
		for (let i = 0; i <= steps; i++) {
			for (let j = 0; j <= steps - i; j++) {
				const u = i / steps,
					v = j / steps;
				const p = a.clone().multiplyScalar(1 - u - v).add(b.clone().multiplyScalar(u)).add(c.clone().multiplyScalar(v));
				p.z += Math.sin(Math.PI * u) * Math.sin(Math.PI * (u + v)) * 0.35 * (1 - v);
				pos.push(p.x, p.y, p.z);
				uv.push(u, 1 - v);
			}
		}
		let row = 0;
		for (let i = 0; i < steps; i++) {
			const n = steps - i + 1;
			for (let j = 0; j < n - 1; j++) {
				const a0 = row + j,
					a1 = row + j + 1,
					b0 = row + n + j;
				idx.push(a0, b0, a1);
				if (j < n - 2) idx.push(a1, b0, b0 + 1);
			}
			row += n;
		}
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setIndex(idx);
		g.computeVertexNormals();
		const jib = new THREE.Mesh(g, jibMat);
		ship.add(jib);
		sails.push(jib);
	}

	const rigGeo = new THREE.BufferGeometry();
	rigGeo.setAttribute('position', new THREE.Float32BufferAttribute(rigPts, 3));
	const rigging = new THREE.LineSegments(
		rigGeo,
		new THREE.LineBasicMaterial({ color: '#0d0a07', transparent: true, opacity: 0.85 })
	);
	ship.add(rigging);

	/* long pennant from the main truck */
	const pennant = new THREE.Mesh(
		new THREE.PlaneGeometry(2.2, 0.55, 24, 2),
		new THREE.MeshStandardMaterial({ map: pennantTexture(), side: THREE.DoubleSide, roughness: 0.9, emissive: '#111', emissiveIntensity: 0.4 })
	);
	pennant.geometry.translate(1.1, 0, 0);
	pennant.position.set(main.x, main.headY - 0.35, 0);
	pennant.rotation.y = Math.PI;
	ship.add(pennant);

	/* deck dressing: helm, capstan, hatch, barrels, crates */
	const helm = new THREE.Group();
	const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 24), spar);
	helm.add(wheel);
	for (let i = 0; i < 8; i++) {
		const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.84, 5), spar);
		spoke.rotation.z = (i / 8) * Math.PI;
		helm.add(spoke);
	}
	const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10), brass);
	hub.rotation.x = Math.PI / 2;
	helm.add(hub);
	helm.rotation.y = Math.PI / 2;
	helm.position.set(-L / 2 + 2.6, 1.75, 0);
	// The supplied captain render includes the wheel and pedestal in its first pose.
	helm.visible = false;
	ship.add(helm);
	const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), darkWood);
	pedestal.position.set(-L / 2 + 2.6, 1.5, 0);
	pedestal.visible = false;
	ship.add(pedestal);
	const capstan = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.55, 12), darkWood);
	capstan.position.set(-1.4, deckY + 0.3, 0);
	ship.add(capstan);
	const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.0), darkWood);
	hatch.position.set(1.8, deckY + 0.08, 0);
	ship.add(hatch);
	const grate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.13, 0.8), iron);
	grate.position.set(1.8, deckY + 0.09, 0);
	ship.add(grate);
	const barrelGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.42, 12);
	const hoopGeo = new THREE.TorusGeometry(0.175, 0.012, 4, 16);
	for (const [x, z] of [
		[2.6, -1.0],
		[2.85, -0.75],
		[2.6, -0.55],
		[-0.9, 1.05]
	]) {
		const b = new THREE.Mesh(barrelGeo, spar);
		b.position.set(x, deckY + 0.22, z);
		ship.add(b);
		for (const dy of [-0.13, 0.13]) {
			const h = new THREE.Mesh(hoopGeo, iron);
			h.rotation.x = Math.PI / 2;
			h.position.set(x, deckY + 0.22 + dy, z);
			ship.add(h);
		}
	}
	const crate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.45), darkWood);
	crate.position.set(-0.6, deckY + 0.2, -1.0);
	crate.rotation.y = 0.4;
	ship.add(crate);

	/* the captain takes the helm; the first panel includes a wooden wheel */
	const captain = makePirateSprite('/images/arul-pirate-helm-hires.png', { width: 2.65, height: 4.3, frame: 0 });
	captain.baseY = 3.42;
	captain.sprite.position.set(-L / 2 + 3.15, captain.baseY, 0.55);
	captain.sprite.rotation.y = -0.15;
	ship.add(captain.sprite);
	const consoleLight = new THREE.PointLight('#5ad6c9', 1.8, 3.5, 2);
	consoleLight.position.set(-L / 2 + 2.6, 2.2, 0.9);
	ship.add(consoleLight);

	return {
		ship,
		sails,
		pennant,
		lanternLight,
		captain,
		length: L
	};
}
