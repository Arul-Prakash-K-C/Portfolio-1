// @ts-nocheck — three ships no bundled types; this file is checked by running it.
/**
 * The Voyage scene — a procedural, asset-free Three.js scene:
 * moonlit ocean (shader), stars, distant islands, a low-poly ship and
 * an original robot crew member with a terminal visor.
 *
 * Everything is generated in code (no external models or textures),
 * so there is nothing to license and almost nothing to download.
 */
import * as THREE from 'three';

const NAVY = new THREE.Color('#0a1424');
const FOG = new THREE.Color('#0b1628');
const PARCHMENT = new THREE.Color('#e8dcc0');
const BRASS = new THREE.Color('#d9a84e');
const TEAL = new THREE.Color('#5ad6c9');

/* ------------------------------------------------------------------ */
/* Ocean                                                               */
/* ------------------------------------------------------------------ */
// Shared wave function (GLSL + JS mirror) so the ship can ride the surface.
const WAVES = [
	// dirX, dirZ, amplitude, wavelength, speed
	[1.0, 0.35, 0.22, 9.0, 0.9],
	[-0.4, 1.0, 0.14, 5.5, 1.2],
	[0.7, -0.6, 0.08, 3.1, 1.6],
	[-0.9, -0.2, 0.05, 1.9, 2.1]
];

function waveHeight(x, z, t) {
	let y = 0;
	for (const [dx, dz, a, l, s] of WAVES) {
		const len = Math.hypot(dx, dz);
		const k = (2 * Math.PI) / l;
		y += a * Math.sin(k * ((dx / len) * x + (dz / len) * z) + t * s);
	}
	return y;
}

const glslWaves = WAVES.map(
	([dx, dz, a, l, s]) =>
		`{ vec2 d = normalize(vec2(${dx.toFixed(3)}, ${dz.toFixed(3)})); float k = ${((2 * Math.PI) / l).toFixed(4)};
       float ph = k * dot(d, p) + uTime * ${s.toFixed(3)};
       h += ${a.toFixed(3)} * sin(ph);
       g += ${a.toFixed(3)} * k * cos(ph) * d; }`
).join('\n');

function makeOcean() {
	const geo = new THREE.PlaneGeometry(260, 260, 220, 220);
	geo.rotateX(-Math.PI / 2);
	const mat = new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uMoonDir: { value: new THREE.Vector3(0.4, 0.33, -1).normalize() },
			uFog: { value: FOG },
			uDeep: { value: new THREE.Color('#050b16') },
			uShallow: { value: new THREE.Color('#12304a') },
			uTeal: { value: TEAL },
			uMoonCol: { value: new THREE.Color('#f3e6c6') }
		},
		vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vH;
      void main() {
        vec3 pos = position;
        vec2 p = pos.xz;
        float h = 0.0; vec2 g = vec2(0.0);
        ${glslWaves}
        pos.y += h;
        vH = h;
        vNormal = normalize(vec3(-g.x, 1.0, -g.y));
        vec4 w = modelMatrix * vec4(pos, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
		fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uMoonDir, uFog, uDeep, uShallow, uTeal, uMoonCol;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vH;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        vec3 col = mix(uDeep, uShallow, clamp(fres * 1.4 + vH * 0.6, 0.0, 1.0));
        // moon glitter path
        vec3 r = reflect(-v, n);
        float spec = pow(max(dot(r, uMoonDir), 0.0), 220.0);
        float glow = pow(max(dot(r, uMoonDir), 0.0), 18.0);
        col += uMoonCol * (spec * 2.2 + glow * 0.16);
        // faint bioluminescent sparkle on crests
        vec2 cell = floor(vWorld.xz * 2.2);
        float s = hash(cell);
        float tw = 0.5 + 0.5 * sin(uTime * (1.5 + s * 3.0) + s * 40.0);
        float crest = smoothstep(0.18, 0.34, vH);
        col += uTeal * step(0.985, s) * tw * crest * 0.55;
        // distance fog
        float d = length(vWorld - cameraPosition);
        float f = 1.0 - exp(-pow(d * 0.018, 1.6));
        col = mix(col, uFog, clamp(f, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }`
	});
	const mesh = new THREE.Mesh(geo, mat);
	return { mesh, mat };
}

/* ------------------------------------------------------------------ */
/* Sky, moon, stars, islands                                           */
/* ------------------------------------------------------------------ */
function makeSky() {
	const geo = new THREE.SphereGeometry(400, 32, 16);
	const mat = new THREE.ShaderMaterial({
		side: THREE.BackSide,
		depthWrite: false,
		uniforms: {
			uTop: { value: new THREE.Color('#02050c') },
			uMid: { value: new THREE.Color('#0a1830') },
			uHorizon: { value: FOG }
		},
		vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
		fragmentShader: `uniform vec3 uTop,uMid,uHorizon; varying vec3 vP;
      void main(){ float y = vP.y; vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.18, y)); c = mix(c, uTop, smoothstep(0.18, 0.7, y)); gl_FragColor = vec4(c,1.0); }`
	});
	return new THREE.Mesh(geo, mat);
}

function makeStars(count) {
	const pos = new Float32Array(count * 3);
	const size = new Float32Array(count);
	for (let i = 0; i < count; i++) {
		const u = Math.random();
		const v = Math.random() * 0.9 + 0.08; // upper hemisphere only
		const theta = 2 * Math.PI * u;
		const phi = Math.acos(1 - v);
		const r = 300;
		pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
		pos[i * 3 + 1] = r * Math.cos(phi);
		pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
		size[i] = Math.random() * 1.6 + 0.4;
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
      void main(){ vA = 0.55 + 0.45 * sin(uTime * 0.8 + position.x * 0.13 + position.z * 0.07);
        gl_PointSize = aSize * uPx * 1.6; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
		fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(0.95,0.92,0.84), vA * smoothstep(0.5, 0.0, d)); }`
	});
	return { points: new THREE.Points(geo, mat), mat };
}

function makeMoon() {
	const g = new THREE.Group();
	const disc = new THREE.Mesh(
		new THREE.CircleGeometry(7, 48),
		new THREE.MeshBasicMaterial({ color: '#fbf1d8', fog: false, toneMapped: false })
	);
	const halo = new THREE.Mesh(
		new THREE.PlaneGeometry(70, 70),
		new THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
			fragmentShader: `varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(1.0 - d, 0.0), 3.0) * 0.55; gl_FragColor = vec4(0.95, 0.88, 0.7, a); }`
		})
	);
	halo.position.z = -0.1;
	g.add(halo, disc);
	return g;
}

function makeIslands() {
	const g = new THREE.Group();
	const mat = new THREE.MeshBasicMaterial({ color: '#08111f' });
	const specs = [
		[-70, -120, 14, 9],
		[-48, -128, 9, 6],
		[60, -140, 18, 11],
		[85, -125, 8, 5],
		[10, -160, 22, 7]
	];
	for (const [x, z, r, h] of specs) {
		const geo = new THREE.ConeGeometry(r, h, 7, 1);
		const m = new THREE.Mesh(geo, mat);
		m.position.set(x, h / 2 - 1.2, z);
		m.scale.z = 0.5;
		g.add(m);
	}
	return g;
}

/* ------------------------------------------------------------------ */
/* Ship                                                                */
/* ------------------------------------------------------------------ */
function makeHull() {
	// Start with a box and taper it into a hull: pointed bow (+x),
	// rounded stern, V-shaped bottom and a raised sheer line at the ends.
	const L = 7,
		H = 1.3,
		W = 1.9;
	const geo = new THREE.BoxGeometry(L, H, W, 28, 6, 8);
	const p = geo.attributes.position;
	for (let i = 0; i < p.count; i++) {
		let x = p.getX(i),
			y = p.getY(i),
			z = p.getZ(i);
		const t = x / (L / 2); // -1 stern .. 1 bow
		const bow = Math.max(t, 0);
		const stern = Math.max(-t, 0);
		let w = 1 - Math.pow(bow, 1.8) * 0.97 - Math.pow(stern, 4) * 0.35;
		const yn = (y + H / 2) / H; // 0 bottom .. 1 top
		w *= 0.45 + 0.55 * Math.pow(yn, 0.6); // V bottom
		z *= Math.max(w, 0.02);
		y += Math.pow(Math.abs(t), 2.6) * 0.55 * yn; // sheer
		if (yn < 0.01) y += Math.pow(bow, 2) * 0.5; // bow rises
		p.setXYZ(i, x, y, z);
	}
	geo.computeVertexNormals();
	return geo;
}

function makeSail(w, h, belly) {
	const geo = new THREE.PlaneGeometry(w, h, 12, 12);
	const p = geo.attributes.position;
	for (let i = 0; i < p.count; i++) {
		const x = p.getX(i) / (w / 2);
		const y = p.getY(i) / (h / 2);
		p.setZ(i, belly * (1 - x * x) * (1 - 0.35 * y * y));
	}
	geo.computeVertexNormals();
	return geo;
}

function makeTerminalTexture() {
	const c = document.createElement('canvas');
	c.width = 128;
	c.height = 64;
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	const ctx = c.getContext('2d');
	const lines = ['> deploy --sea', '> git push', '> npm run sail', '> ok ✓'];
	let tick = 0;
	function draw(blink) {
		ctx.fillStyle = '#04151a';
		ctx.fillRect(0, 0, 128, 64);
		ctx.font = 'bold 11px monospace';
		ctx.fillStyle = '#5ad6c9';
		const start = tick % lines.length;
		for (let i = 0; i < 3; i++) ctx.fillText(lines[(start + i) % lines.length], 8, 18 + i * 15);
		if (blink) ctx.fillRect(8, 52, 7, 3);
		tex.needsUpdate = true;
	}
	draw(true);
	return {
		tex,
		update(t) {
			const nt = Math.floor(t / 1.6);
			const blink = Math.floor(t * 2) % 2 === 0;
			if (nt !== tick || blink !== this._b) {
				tick = nt;
				this._b = blink;
				draw(blink);
			}
		}
	};
}

function makeRobot() {
	const g = new THREE.Group();
	const metal = new THREE.MeshStandardMaterial({ color: '#8d97a6', metalness: 0.75, roughness: 0.35 });
	const brass = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.9, roughness: 0.3 });
	const dark = new THREE.MeshStandardMaterial({ color: '#1b2230', metalness: 0.4, roughness: 0.6 });

	const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.55, 14), metal);
	body.position.y = 0.55;
	const belt = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 20), brass);
	belt.rotation.x = Math.PI / 2;
	belt.position.y = 0.36;

	const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.46, 2, 2, 2), metal);
	head.position.y = 1.05;
	const term = makeTerminalTexture();
	const visor = new THREE.Mesh(
		new THREE.PlaneGeometry(0.5, 0.25),
		new THREE.MeshBasicMaterial({ map: term.tex, toneMapped: false })
	);
	visor.position.set(0, 1.06, 0.235);
	// diagnostic eye on the side of the head
	const eye = new THREE.Mesh(
		new THREE.SphereGeometry(0.06, 12, 12),
		new THREE.MeshBasicMaterial({ color: TEAL, toneMapped: false })
	);
	eye.position.set(0.32, 1.12, 0.1);
	const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), brass);
	antenna.position.set(-0.15, 1.4, 0);
	const tip = new THREE.Mesh(
		new THREE.SphereGeometry(0.045, 10, 10),
		new THREE.MeshBasicMaterial({ color: BRASS, toneMapped: false })
	);
	tip.position.set(-0.15, 1.56, 0);
	// tricorne-ish hat brim: an original, simple three-point brim
	const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 3), dark);
	hat.position.y = 1.3;
	hat.rotation.y = Math.PI / 6;
	const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.16, 10), dark);
	crown.position.y = 1.39;

	const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8);
	const armL = new THREE.Mesh(armGeo, metal);
	armL.position.set(-0.36, 0.6, 0);
	armL.rotation.z = 0.35;
	const armR = new THREE.Mesh(armGeo, metal);
	armR.position.set(0.36, 0.72, 0.08);
	armR.rotation.z = -1.1; // waving arm
	const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 8);
	const legL = new THREE.Mesh(legGeo, dark);
	legL.position.set(-0.12, 0.15, 0);
	const legR = legL.clone();
	legR.position.x = 0.12;

	g.add(body, belt, head, visor, eye, antenna, tip, hat, crown, armL, armR, legL, legR);
	return { group: g, term, armR, tip, eye };
}

function makeShip() {
	const ship = new THREE.Group();
	const wood = new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.8, metalness: 0.05 });
	const woodDark = new THREE.MeshStandardMaterial({ color: '#22150d', roughness: 0.9 });
	const brass = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.85, roughness: 0.35 });
	const sailMat = new THREE.MeshStandardMaterial({
		color: PARCHMENT,
		roughness: 0.95,
		side: THREE.DoubleSide,
		emissive: new THREE.Color('#4a3c24'),
		emissiveIntensity: 0.55
	});

	const hull = new THREE.Mesh(makeHull(), wood);
	hull.position.y = 0.25;
	ship.add(hull);

	// trim stripe
	const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.06, 1.62), brass);
	stripe.position.set(-0.4, 0.62, 0);
	ship.add(stripe);

	const deck = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.08, 1.5), woodDark);
	deck.position.set(-0.3, 0.86, 0);
	ship.add(deck);

	// stern cabin
	const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.45), wood);
	cabin.position.set(-2.75, 1.25, 0);
	ship.add(cabin);
	const winMat = new THREE.MeshBasicMaterial({ color: '#ffb85c', toneMapped: false });
	for (let i = -1; i <= 1; i++) {
		const w = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.2), winMat);
		w.position.set(-3.46, 1.28, i * 0.4);
		w.rotation.y = -Math.PI / 2;
		ship.add(w);
	}

	// masts and sails
	const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, 5.2, 8);
	const masts = [
		{ x: 0.9, h: 5.2, sails: [[2.4, 1.6, 3.7], [2.0, 1.3, 2.2]] },
		{ x: -1.3, h: 4.6, sails: [[2.2, 1.5, 3.3], [1.8, 1.1, 1.95]] }
	];
	const sailMeshes = [];
	for (const m of masts) {
		const mast = new THREE.Mesh(mastGeo, woodDark);
		mast.scale.y = m.h / 5.2;
		mast.position.set(m.x, 0.86 + m.h / 2, 0);
		ship.add(mast);
		for (const [w, h, y] of m.sails) {
			const sail = new THREE.Mesh(makeSail(w, h, 0.35), sailMat);
			sail.position.set(m.x + 0.05, 0.86 + y - 0.9, 0);
			sail.rotation.y = Math.PI / 2 - 0.28;
			ship.add(sail);
			sailMeshes.push(sail);
			const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, w + 0.3, 6), woodDark);
			yard.rotation.x = Math.PI / 2;
			yard.rotation.y = -0.28;
			yard.position.set(m.x, 0.86 + y - 0.9 + h / 2 + 0.03, 0);
			ship.add(yard);
		}
	}
	// jib sail
	const jibGeo = new THREE.BufferGeometry();
	jibGeo.setAttribute(
		'position',
		new THREE.Float32BufferAttribute([0.95, 1.2, 0, 0.95, 5.6, 0, 3.6, 1.15, 0], 3)
	);
	jibGeo.computeVertexNormals();
	const jib = new THREE.Mesh(jibGeo, sailMat);
	ship.add(jib);
	// bowsprit
	const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.8, 6), woodDark);
	bowsprit.rotation.z = -1.25;
	bowsprit.position.set(3.75, 1.2, 0);
	ship.add(bowsprit);

	// flag: brass compass-rose pennant (original)
	const flag = new THREE.Mesh(
		new THREE.PlaneGeometry(0.7, 0.4, 8, 2),
		new THREE.MeshStandardMaterial({ color: '#141b28', side: THREE.DoubleSide, roughness: 0.9 })
	);
	flag.position.set(0.9 - 0.35, 0.86 + 5.2 + 0.05, 0);
	ship.add(flag);

	// lanterns
	const lanternMat = new THREE.MeshBasicMaterial({ color: '#ffc46b', toneMapped: false });
	const lanterns = [];
	for (const [x, y] of [
		[-3.45, 1.85],
		[3.2, 1.25]
	]) {
		const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), lanternMat);
		l.position.set(x, y, 0);
		ship.add(l);
		lanterns.push(l);
	}
	const lanternLight = new THREE.PointLight('#ffb653', 6, 9, 1.6);
	lanternLight.position.set(-3.2, 1.9, 0.3);
	ship.add(lanternLight);

	// robot crew member near the stern
	const robot = makeRobot();
	robot.group.position.set(-1.9, 0.9, 0.35);
	robot.group.rotation.y = 0.9;
	robot.group.scale.setScalar(0.85);
	ship.add(robot.group);
	const consoleLight = new THREE.PointLight(TEAL, 2.2, 3.5, 2);
	consoleLight.position.set(-1.6, 1.9, 0.9);
	ship.add(consoleLight);

	return { ship, sailMeshes, flag, lanterns, lanternLight, robot };
}

/* ------------------------------------------------------------------ */
/* Bioluminescent motes                                                */
/* ------------------------------------------------------------------ */
function makeMotes(count) {
	const pos = new Float32Array(count * 3);
	const seed = new Float32Array(count);
	for (let i = 0; i < count; i++) {
		pos[i * 3] = (Math.random() - 0.5) * 60;
		pos[i * 3 + 1] = Math.random() * 3 + 0.2;
		pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 4;
		seed[i] = Math.random();
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
	const mat = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uCol: { value: TEAL } },
		vertexShader: `attribute float aSeed; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vec3 p = position; p.y += sin(uTime * 0.4 + aSeed * 30.0) * 0.4; p.x += sin(uTime * 0.2 + aSeed * 10.0) * 0.6;
        vA = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * (0.7 + aSeed) + aSeed * 50.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (3.0 + aSeed * 3.0) * uPx * (12.0 / -mv.z);
        gl_Position = projectionMatrix * mv; }`,
		fragmentShader: `uniform vec3 uCol; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        gl_FragColor = vec4(uCol, vA * smoothstep(0.5, 0.0, d) * 0.7); }`
	});
	return { points: new THREE.Points(geo, mat), mat };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */
/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ quality?: 'high'|'low' }} [opts]
 */
export function createVoyage(canvas, opts = {}) {
	const low = opts.quality === 'low';
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: !low,
		alpha: false,
		powerPreference: 'high-performance'
	});
	const dpr = Math.min(window.devicePixelRatio || 1, low ? 1.25 : 1.75);
	renderer.setPixelRatio(dpr);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;
	renderer.setClearColor(NAVY);

	const scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(FOG, 0.012);

	const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 900);

	scene.add(makeSky());
	const stars = makeStars(low ? 700 : 1600);
	stars.mat.uniforms.uPx.value = dpr;
	scene.add(stars.points);

	const moon = makeMoon();
	moon.position.set(78, 62, -175);
	moon.lookAt(0, 0, 0);
	scene.add(moon);

	scene.add(makeIslands());

	const ocean = makeOcean();
	scene.add(ocean.mesh);

	const motes = makeMotes(low ? 60 : 140);
	motes.mat.uniforms.uPx.value = dpr;
	scene.add(motes.points);

	// Lights: cool moonlight + soft navy fill
	const moonLight = new THREE.DirectionalLight('#dfe4ff', 1.5);
	moonLight.position.set(30, 40, -60);
	scene.add(moonLight);
	const rim = new THREE.DirectionalLight('#5ad6c9', 0.18);
	rim.position.set(20, 10, 30);
	scene.add(rim);
	// soft warm fill from the viewer's side so the ship isn't a pure silhouette
	const fill = new THREE.DirectionalLight('#ffd9a0', 0.55);
	fill.position.set(-10, 6, 20);
	scene.add(fill);
	scene.add(new THREE.HemisphereLight('#3a4f78', '#05080f', 1.3));

	const ship = makeShip();
	ship.ship.position.set(6.6, 0, -3);
	ship.ship.rotation.y = -0.5;
	scene.add(ship.ship);

	// Camera keyframes along hero scroll: wide shot → deck & robot → sky
	const keys = [
		{ p: 0, pos: new THREE.Vector3(-1, 2.4, 13), look: new THREE.Vector3(3.0, 2.3, -2) },
		{ p: 0.55, pos: new THREE.Vector3(1.6, 3.4, 10), look: new THREE.Vector3(5.2, 2.6, -3) },
		{ p: 1, pos: new THREE.Vector3(2.4, 5.2, 9), look: new THREE.Vector3(4, 13, -22) }
	];
	const tmpPos = new THREE.Vector3();
	const tmpLook = new THREE.Vector3();
	const look = new THREE.Vector3();

	let scroll = 0,
		scrollSmooth = 0;
	let px = 0,
		py = 0,
		pxs = 0,
		pys = 0;
	let lookShift = 0;
	let raf = 0,
		running = false,
		last = performance.now(),
		time = 0;

	function resize() {
		const w = canvas.clientWidth || window.innerWidth;
		const h = canvas.clientHeight || window.innerHeight;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		// keep the ship framed on narrow screens
		const narrow = w / h < 0.9;
		camera.fov = narrow ? 56 : 42;
		lookShift = narrow ? 3.4 : w / h < 1.3 ? 1.4 : 0;
		camera.updateProjectionMatrix();
	}

	function frame(dt) {
		time += dt;
		scrollSmooth += (scroll - scrollSmooth) * Math.min(1, dt * 4);
		pxs += (px - pxs) * Math.min(1, dt * 2.5);
		pys += (py - pys) * Math.min(1, dt * 2.5);

		ocean.mat.uniforms.uTime.value = time;
		stars.mat.uniforms.uTime.value = time;
		motes.mat.uniforms.uTime.value = time;

		// ship rides the waves
		const s = ship.ship;
		const bx = s.position.x,
			bz = s.position.z;
		const hC = waveHeight(bx, bz, time);
		const hF = waveHeight(bx + 2.5, bz, time);
		const hB = waveHeight(bx - 2.5, bz, time);
		const hS = waveHeight(bx, bz + 0.9, time);
		s.position.y = hC * 0.8 - 0.05;
		s.rotation.z = Math.atan2(hF - hB, 5) * 0.8;
		s.rotation.x = Math.atan2(hS - hC, 0.9) * 0.35;

		// sail breathing, flag flutter
		for (let i = 0; i < ship.sailMeshes.length; i++) {
			ship.sailMeshes[i].scale.z = 1 + Math.sin(time * 1.3 + i) * 0.12;
		}
		const fp = ship.flag.geometry.attributes.position;
		for (let i = 0; i < fp.count; i++) {
			const x = fp.getX(i) + 0.35;
			fp.setZ(i, Math.sin(time * 5 + x * 7) * 0.06 * x);
		}
		fp.needsUpdate = true;

		// robot: wave, blink, terminal
		ship.robot.armR.rotation.z = -1.1 + Math.sin(time * 3) * 0.35;
		ship.robot.tip.visible = Math.sin(time * 4) > -0.6;
		ship.robot.term.update(time);
		ship.lanternLight.intensity = 5.5 + Math.sin(time * 7) * 0.4 + Math.sin(time * 13) * 0.25;

		// camera along keyframes
		const p = Math.min(Math.max(scrollSmooth, 0), 1);
		let a = keys[0],
			b = keys[1];
		if (p > keys[1].p) {
			a = keys[1];
			b = keys[2];
		}
		const t = (p - a.p) / (b.p - a.p);
		const e = t * t * (3 - 2 * t);
		tmpPos.lerpVectors(a.pos, b.pos, e);
		tmpLook.lerpVectors(a.look, b.look, e);
		tmpPos.x += lookShift;
		tmpLook.x += lookShift;
		camera.position.set(
			tmpPos.x + pxs * 0.7,
			tmpPos.y + pys * 0.35 + Math.sin(time * 0.6) * 0.05,
			tmpPos.z
		);
		look.copy(tmpLook);
		camera.lookAt(look);

		renderer.render(scene, camera);
	}

	function loop(now) {
		const dt = Math.min((now - last) / 1000, 0.05);
		last = now;
		frame(dt);
		raf = requestAnimationFrame(loop);
	}

	resize();

	return {
		/** Render a single still frame (used for reduced motion). */
		renderStill() {
			frame(0.016);
		},
		start() {
			if (running) return;
			running = true;
			last = performance.now();
			raf = requestAnimationFrame(loop);
		},
		stop() {
			running = false;
			cancelAnimationFrame(raf);
		},
		get running() {
			return running;
		},
		/** @param {number} p 0..1 progress through the hero */
		setScroll(p) {
			scroll = p;
			if (!running) {
				scrollSmooth = p;
			}
		},
		/** @param {number} x -1..1 @param {number} y -1..1 */
		setPointer(x, y) {
			px = x;
			py = y;
		},
		resize,
		dispose() {
			this.stop();
			scene.traverse((o) => {
				if (o.geometry) o.geometry.dispose();
				if (o.material) {
					const mats = Array.isArray(o.material) ? o.material : [o.material];
					for (const m of mats) {
						if (m.map) m.map.dispose();
						m.dispose();
					}
				}
			});
			renderer.dispose();
		}
	};
}
