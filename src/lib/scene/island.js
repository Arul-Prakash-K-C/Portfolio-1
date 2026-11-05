// @ts-nocheck — three ships no bundled types; this file is checked by running it.
/**
 * Signal Isle: a small rocky island with palms and a driftwood signal fire
 * in a ring of stones, lit as the visitor reaches the contact section. Original, generated in code.
 */
import * as THREE from 'three';

function flameTexture() {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const x = c.getContext('2d');
	const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
	g.addColorStop(0, 'rgba(255,240,200,1)');
	g.addColorStop(0.25, 'rgba(255,190,90,0.9)');
	g.addColorStop(0.6, 'rgba(255,110,30,0.35)');
	g.addColorStop(1, 'rgba(255,80,20,0)');
	x.fillStyle = g;
	x.fillRect(0, 0, 128, 128);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

function palm(rockMat) {
	const g = new THREE.Group();
	const pts = [];
	for (let i = 0; i <= 8; i++) {
		const t = i / 8;
		pts.push(new THREE.Vector3(Math.sin(t * 1.4) * 0.9, t * 4.2, 0));
	}
	const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.12, 6), rockMat);
	g.add(trunk);
	const frondMat = new THREE.MeshStandardMaterial({ color: '#0d1d17', roughness: 0.9, side: THREE.DoubleSide });
	const top = pts[pts.length - 1];
	for (let i = 0; i < 7; i++) {
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.quadraticCurveTo(1.2, 0.35, 2.3, -0.5);
		shape.quadraticCurveTo(1.2, -0.05, 0, 0);
		const f = new THREE.Mesh(new THREE.ShapeGeometry(shape, 8), frondMat);
		f.position.copy(top);
		f.rotation.y = (i / 7) * Math.PI * 2;
		f.rotation.z = -0.25;
		g.add(f);
	}
	return g;
}

export function makeSignalIsle() {
	const root = new THREE.Group();
	const rock = new THREE.MeshStandardMaterial({ color: '#141a22', roughness: 0.95 });
	const sand = new THREE.MeshStandardMaterial({ color: '#2a2a28', roughness: 1 });
	const stone = new THREE.MeshStandardMaterial({ color: '#3a3833', roughness: 0.9 });

	// island body: a lumpy, flattened hemisphere with a sand skirt
	const hill = new THREE.SphereGeometry(14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
	const p = hill.attributes.position;
	for (let i = 0; i < p.count; i++) {
		const x = p.getX(i),
			y = p.getY(i),
			z = p.getZ(i);
		const n = Math.sin(x * 0.45) * Math.cos(z * 0.38) * 1.4 + Math.sin(x * 1.3 + z) * 0.4;
		p.setY(i, y * 0.42 + n * (y > 0.5 ? 1 : 0.2));
	}
	hill.computeVertexNormals();
	const hillMesh = new THREE.Mesh(hill, rock);
	hillMesh.position.y = -1.2;
	root.add(hillMesh);
	const skirt = new THREE.Mesh(new THREE.CylinderGeometry(15.5, 17, 1.2, 32), sand);
	skirt.position.y = -1;
	root.add(skirt);
	for (const [x, z, s] of [
		[-12, 6, 1.8],
		[11, 7, 1.3],
		[14, -3, 2.2],
		[-15, -2, 1.5]
	]) {
		const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rock);
		r.position.set(x, -0.2, z);
		r.rotation.set(x, z, s);
		root.add(r);
	}
	for (const [x, z, ry] of [
		[-6, 5, 0.3],
		[-8.5, 2, 1.4],
		[7, 4, 2.6]
	]) {
		const t = palm(rock);
		t.position.set(x, 2.4, z);
		t.rotation.y = ry;
		root.add(t);
	}

	// signal beacon: a ring of stones and a stacked driftwood fire on the summit (no tower)
	const FIRE_Y = 5.0;
	for (let i = 0; i < 9; i++) {
		const a = (i / 9) * Math.PI * 2;
		const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), stone);
		st.position.set(Math.cos(a) * 1.35, FIRE_Y - 0.25, Math.sin(a) * 1.35);
		st.rotation.set(a, a * 2, 0);
		root.add(st);
	}
	const woodMat = new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: 0.95 });
	for (let i = 0; i < 6; i++) {
		const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.9, 6), woodMat);
		const a = (i / 6) * Math.PI * 2;
		log.position.set(Math.cos(a) * 0.35, FIRE_Y + 0.35, Math.sin(a) * 0.35);
		log.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
		root.add(log);
	}

	// fire: stacked additive sprites + light
	const fireTex = flameTexture();
	const flames = [];
	for (let i = 0; i < 6; i++) {
		const s = new THREE.Sprite(
			new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })
		);
		s.position.set((Math.random() - 0.5) * 0.6, FIRE_Y + 0.6 + i * 0.25, (Math.random() - 0.5) * 0.6);
		s.userData.seed = Math.random() * 10;
		s.scale.setScalar(1.6);
		root.add(s);
		flames.push(s);
	}
	const halo = new THREE.Sprite(
		new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })
	);
	halo.position.set(0, FIRE_Y + 0.9, 0);
	halo.scale.setScalar(9);
	root.add(halo);
	const light = new THREE.PointLight('#ff9a3c', 0, 60, 1.4);
	light.position.set(0, FIRE_Y + 1.1, 0);
	root.add(light);

	/**
	 * @param {number} lit 0..1 ignition level
	 * @param {number} time seconds
	 */
	function update(lit, time) {
		for (const s of flames) {
			const k = s.userData.seed;
			const flick = 0.75 + 0.25 * Math.sin(time * 9 + k) * Math.sin(time * 5.3 + k * 2);
			s.material.opacity = lit * flick;
			s.scale.setScalar((1.2 + 0.6 * lit) * (0.85 + 0.3 * Math.sin(time * 4 + k)));
			s.position.y = FIRE_Y + 0.6 + ((time * 0.8 + k) % 1.5) * lit;
		}
		halo.material.opacity = lit * 0.22;
		light.intensity = lit * (650 + Math.sin(time * 11) * 60);
	}
	update(0, 0);

	return { root, update, light };
}
