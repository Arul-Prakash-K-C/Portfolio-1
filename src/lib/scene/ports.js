// @ts-nocheck — three ships no bundled types; this file is checked by running it.
/**
 * Ports of call for the Experience voyage: small rocky islets with a
 * lighthouse each. Studies, course projects and crew posts get their own
 * band colours. The active port's lamp lights and sweeps its beam as the
 * ship passes. All geometry is generated here.
 */
import * as THREE from 'three';

const BANDS = {
	'Port of study': '#3fb6aa',
	'Course project': '#c8913c',
	'Crew record': '#a8352c'
};

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

/** @param {string} kind @param {number} seed */
export function makePort(kind, seed) {
	const r = rng(seed * 97 + 13);
	const root = new THREE.Group();
	const rockMat = new THREE.MeshStandardMaterial({ color: '#2a2724', roughness: 0.95, flatShading: true });
	const wetMat = new THREE.MeshStandardMaterial({ color: '#141618', roughness: 0.4, metalness: 0.1, flatShading: true });
	const white = new THREE.MeshStandardMaterial({ color: '#d9d2c2', roughness: 0.7 });
	const band = new THREE.MeshStandardMaterial({ color: BANDS[kind] ?? '#3fb6aa', roughness: 0.6 });
	const iron = new THREE.MeshStandardMaterial({ color: '#1a1c1f', metalness: 0.6, roughness: 0.45 });

	// a cluster of jagged rocks, the waterline darker and wet
	for (let i = 0; i < 6; i++) {
		const g = new THREE.DodecahedronGeometry(1, 1);
		const p = g.attributes.position;
		for (let k = 0; k < p.count; k++) {
			const n = 0.75 + r() * 0.45;
			p.setXYZ(k, p.getX(k) * n, p.getY(k) * n, p.getZ(k) * n);
		}
		g.computeVertexNormals();
		const m = new THREE.Mesh(g, i < 2 ? rockMat : wetMat);
		const a = (i / 6) * Math.PI * 2 + r();
		const d = i < 2 ? 0 : 1.6 + r() * 1.4;
		m.position.set(Math.cos(a) * d, i < 2 ? 0.2 : -0.2, Math.sin(a) * d);
		m.scale.set(1.6 + r() * 1.2, i < 2 ? 1.3 + r() * 0.6 : 0.5 + r() * 0.5, 1.4 + r());
		m.rotation.set(r() * 3, r() * 3, r() * 3);
		root.add(m);
	}

	// lighthouse: tapered tower in alternating bands, gallery, lamp room, cap
	const tower = new THREE.Group();
	tower.position.y = 1.2;
	root.add(tower);
	const H = 5.2;
	const SEG = 5;
	for (let i = 0; i < SEG; i++) {
		const y0 = (i / SEG) * H,
			y1 = ((i + 1) / SEG) * H;
		const r0 = 0.95 - (y0 / H) * 0.35,
			r1 = 0.95 - (y1 / H) * 0.35;
		const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, y1 - y0, 20), i % 2 ? band : white);
		m.position.y = (y0 + y1) / 2;
		tower.add(m);
	}
	const gallery = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 24), iron);
	gallery.position.y = H + 0.04;
	tower.add(gallery);
	const rail = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.02, 4, 32), iron);
	rail.rotation.x = Math.PI / 2;
	rail.position.y = H + 0.4;
	tower.add(rail);
	const lampMat = new THREE.MeshBasicMaterial({ color: '#ffd28a', toneMapped: false });
	const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.7, 16), lampMat);
	lamp.position.y = H + 0.45;
	tower.add(lamp);
	const cap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.6, 16), iron);
	cap.position.y = H + 1.1;
	tower.add(cap);
	const vane = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), iron);
	vane.position.y = H + 1.6;
	tower.add(vane);
	// a small pennant in the port's colour
	const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.32, 6, 1), new THREE.MeshStandardMaterial({ color: BANDS[kind] ?? '#3fb6aa', side: THREE.DoubleSide, roughness: 0.8 }));
	flag.position.set(0.32, H + 1.7, 0);
	tower.add(flag);

	// sweeping beams (two opposed cones), visible when the port is lit
	const beamMat = new THREE.MeshBasicMaterial({
		color: '#ffdca0',
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		side: THREE.DoubleSide,
		toneMapped: false
	});
	const beams = new THREE.Group();
	beams.position.y = H + 0.45;
	tower.add(beams);
	for (const s of [-1, 1]) {
		const g = new THREE.ConeGeometry(2.2, 26, 24, 1, true);
		g.translate(0, -13, 0);
		const m = new THREE.Mesh(g, beamMat);
		m.rotation.z = s * Math.PI / 2;
		beams.add(m);
	}
	const light = new THREE.PointLight('#ffc070', 0, 30, 1.6);
	light.position.y = H + 0.45;
	tower.add(light);

	const fp = flag.geometry.attributes.position;
	const fx0 = Float32Array.from({ length: fp.count }, (_, i) => fp.getX(i));
	return {
		root,
		/** @param {number} lit 0..1 @param {number} time */
		update(lit, time) {
			lampMat.color.setRGB(0.3 + 1.7 * lit, 0.22 + 1.3 * lit, 0.1 + 0.7 * lit);
			beamMat.opacity = 0.2 * lit;
			beams.rotation.y = time * 0.9;
			light.intensity = lit * 9;
			for (let i = 0; i < fp.count; i++) {
				const x = fx0[i] + 0.3;
				fp.setZ(i, Math.sin(time * 6 - x * 6) * 0.06 * x);
			}
			fp.needsUpdate = true;
		}
	};
}
