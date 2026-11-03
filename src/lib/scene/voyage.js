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
import { makeMaterials, makeWheel, makeCaptain, makeChartTable, makeChest } from './props.js';
import { makeSignalIsle } from './island.js';

const FOG = new THREE.Color('#0d1a2e');
const TEAL = new THREE.Color('#5ad6c9');
const MOON_POS = new THREE.Vector3(160, 74, -190);

/* ------------------------------------------------------------------ */
/* Ocean (Gerstner waves)                                               */
/* ------------------------------------------------------------------ */
const WAVES = [
	// dirX, dirZ, steepness, wavelength, speed
	[1.0, 0.25, 0.22, 16, 1.0],
	[0.6, 0.8, 0.18, 9, 1.15],
	[-0.3, 1.0, 0.14, 5.5, 1.35],
	[0.9, -0.5, 0.1, 3.2, 1.7],
	[-0.8, -0.3, 0.06, 1.9, 2.1]
];

/** Vertical displacement only, used to float the ship. */
function waveHeight(x, z, t) {
	let y = 0;
	for (const [dx, dz, st, l, s] of WAVES) {
		const len = Math.hypot(dx, dz);
		const k = (2 * Math.PI) / l;
		const a = st / k;
		y += a * Math.sin(k * ((dx / len) * x + (dz / len) * z) - t * s * Math.sqrt(9.8 / k) * 0.35);
	}
	return y;
}

const glslWaves = WAVES.map(([dx, dz, st, l, s]) => {
	const len = Math.hypot(dx, dz);
	const k = (2 * Math.PI) / l;
	const a = st / k;
	const w = s * Math.sqrt(9.8 / k) * 0.35;
	return `{ vec2 d = vec2(${(dx / len).toFixed(4)}, ${(dz / len).toFixed(4)});
      float f = ${k.toFixed(4)} * dot(d, p) - uTime * ${w.toFixed(4)};
      float c = cos(f), s = sin(f);
      disp += vec3(d.x * ${a.toFixed(4)} * c, ${a.toFixed(4)} * s, d.y * ${a.toFixed(4)} * c);
      tang += vec3(-d.x * d.x * ${st.toFixed(4)} * s, d.x * ${st.toFixed(4)} * c, -d.x * d.y * ${st.toFixed(4)} * s);
      bin  += vec3(-d.x * d.y * ${st.toFixed(4)} * s, d.y * ${st.toFixed(4)} * c, -d.y * d.y * ${st.toFixed(4)} * s);
      crest += ${st.toFixed(4)} * max(s, 0.0); }`;
}).join('\n');

function makeOcean(segments) {
	const geo = new THREE.PlaneGeometry(320, 320, segments, segments);
	geo.rotateX(-Math.PI / 2);
	const mat = new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uMoonDir: { value: MOON_POS.clone().normalize() },
			uFog: { value: FOG },
			uDeep: { value: new THREE.Color('#03070f') },
			uShallow: { value: new THREE.Color('#123049') },
			uSky: { value: new THREE.Color('#1c3354') },
			uTeal: { value: TEAL },
			uMoonCol: { value: new THREE.Color('#ffeccc') },
			uLantern: { value: new THREE.Vector3() },
			uBeacon: { value: new THREE.Vector3() },
			uBeaconI: { value: 0 }
		},
		vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vCrest;
      void main() {
        vec3 pos = position;
        vec2 p = pos.xz;
        vec3 disp = vec3(0.0);
        vec3 tang = vec3(1.0, 0.0, 0.0);
        vec3 bin = vec3(0.0, 0.0, 1.0);
        float crest = 0.0;
        // fade waves far away to avoid aliasing at the horizon
        float fade = 1.0 - smoothstep(60.0, 150.0, length(p));
        ${glslWaves}
        pos += disp * fade;
        vNormal = normalize(mix(vec3(0.0, 1.0, 0.0), cross(bin, tang), fade));
        vCrest = crest * fade;
        vec4 w = modelMatrix * vec4(pos, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
		fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uMoonDir, uFog, uDeep, uShallow, uSky, uTeal, uMoonCol, uLantern, uBeacon;
      uniform float uBeaconI;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vCrest;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      void main() {
        vec3 n = normalize(vNormal);
        // fine ripples
        vec2 rp = vWorld.xz * 1.6 + vec2(uTime * 0.6, uTime * 0.4);
        n = normalize(n + vec3(noise(rp) - 0.5, 0.0, noise(rp + 13.7) - 0.5) * 0.18);
        vec3 v = normalize(cameraPosition - vWorld);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 body = mix(uDeep, uShallow, clamp(vCrest * 2.2, 0.0, 1.0) * 0.6);
        vec3 col = mix(body, uSky, fres * 0.75);
        // moon glitter path + broad sheen
        vec3 r = reflect(-v, n);
        float md = max(dot(r, uMoonDir), 0.0);
        col += uMoonCol * (pow(md, 400.0) * 3.5 + pow(md, 40.0) * 0.35 + pow(md, 6.0) * 0.05);
        // warm lantern reflection from the ship
        vec3 ld = normalize(uLantern - vWorld);
        float lr = pow(max(dot(r, ld), 0.0), 120.0);
        float ldist = length(uLantern - vWorld);
        col += vec3(1.0, 0.62, 0.25) * lr * 2.0 * exp(-ldist * 0.06);
        // the island beacon's long reflection once it is lit
        vec3 bd = normalize(uBeacon - vWorld);
        float br = pow(max(dot(r, bd), 0.0), 60.0);
        col += vec3(1.0, 0.6, 0.25) * br * 2.5 * uBeaconI;
        // foam on steep crests
        float foam = smoothstep(0.42, 0.62, vCrest) * (0.55 + 0.45 * noise(vWorld.xz * 3.0 + uTime));
        col = mix(col, vec3(0.62, 0.68, 0.74), foam * 0.35);
        // faint bioluminescence in the troughs
        float cell = hash(floor(vWorld.xz * 2.4));
        float tw = 0.5 + 0.5 * sin(uTime * (1.2 + cell * 3.0) + cell * 40.0);
        col += uTeal * step(0.988, cell) * tw * 0.4 * (1.0 - foam);
        // atmospheric fog
        float d = length(vWorld - cameraPosition);
        float f = 1.0 - exp(-pow(d * 0.0125, 1.5));
        col = mix(col, uFog, clamp(f, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }`
	});
	return { mesh: new THREE.Mesh(geo, mat), mat };
}

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
		[0, 2.5, -40, 160, 9],
		[-20, 2.0, -70, 200, 12],
		[30, 1.6, -22, 90, 6],
		[-40, 1.5, -12, 70, 5]
	];
	for (const [x, y, z, w, h] of banks) {
		const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
		m.position.set(x, y, z);
		g.add(m);
	}
	return { group: g, mat };
}

function makeMotes(count) {
	const pos = new Float32Array(count * 3);
	const seed = new Float32Array(count);
	for (let i = 0; i < count; i++) {
		pos[i * 3] = (Math.random() - 0.5) * 70;
		pos[i * 3 + 1] = Math.random() * 3 + 0.3;
		pos[i * 3 + 2] = (Math.random() - 0.5) * 50 - 6;
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
        gl_PointSize = (3.0 + aSeed * 3.0) * uPx * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv; }`,
		fragmentShader: `uniform vec3 uCol; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        gl_FragColor = vec4(uCol, vA * smoothstep(0.5, 0.0, d) * 0.6); }`
	});
	return { points: new THREE.Points(geo, mat), mat };
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
	{ t: 1, pos: [-2.6, 2.95, 2.9], look: [-4.8, 2.75, 0.05], follow: 1, offset: 0.2 },
	{ t: 2, pos: [-1.3, 2.9, 1.6], look: [-1.86, 1.32, -0.04], follow: 1, offset: 0.2 },
	{ t: 3, pos: [-2.0, 3.25, 0.62], look: [-2.03, 1.33, -0.02], follow: 1, offset: 0.0 },
	{ t: 4, pos: [-1.05, 1.92, 0.98], look: [-1.52, 1.36, 0.16], follow: 1, offset: 0.16 },
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
 * @param {{ quality?: 'high'|'low', destinations?: {title:string}[], intro?: boolean, onIntroEnd?: () => void, onFrame?: (haze: number) => void }} [opts]
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
	const ocean = makeOcean(low ? 160 : 260);
	scene.add(ocean.mesh);
	const motes = makeMotes(low ? 50 : 120);
	motes.mat.uniforms.uPx.value = dpr;
	scene.add(motes.points);

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

	/* story props */
	const mats = makeMaterials();
	const helm = makeWheel(mats);
	helm.root.position.set(-4.3, 1.28, 0);
	helm.root.rotation.y = Math.PI; // wheel faces aft, toward the captain
	ship.add(helm.root);
	const captain = makeCaptain(mats);
	captain.root.position.set(-5.05, 1.28, 0);
	ship.add(captain.root);
	const table = makeChartTable(mats, opts.destinations ?? []);
	table.root.position.set(-1.95, 0.5, 0);
	ship.add(table.root);
	g.robot.group.position.set(-1.95, 0.5, -0.82);
	g.robot.group.rotation.y = 0;
	const chest = makeChest(mats);
	chest.root.position.set(4.15, 0.6, 0.15);
	chest.root.rotation.y = 0.5;
	ship.add(chest.root);
	const isle = makeSignalIsle();
	isle.root.position.copy(ISLE_POS);
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
	const focus = { skill: 0, project: -1, projectsFrac: 0 };
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
	const camPos = new THREE.Vector3(),
		camLook = new THREE.Vector3(),
		tmpA = new THREE.Vector3(),
		tmpB = new THREE.Vector3(),
		lanternWorld = new THREE.Vector3(),
		beaconWorld = new THREE.Vector3();
	const handL = new THREE.Vector3(),
		handR = new THREE.Vector3();

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
		composer?.setSize(vw, vh);
		film?.uniforms.uRes.value.set(vw * dpr, vh * dpr);
		camera.aspect = vw / vh;
		narrow = vw / vh < 0.9;
		camera.fov = narrow ? 50 : 34;
		camera.updateProjectionMatrix();
	}

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
		motes.mat.uniforms.uTime.value = time;
		fog.mat.uniforms.uTime.value = time;
		if (film) film.uniforms.uTime.value = time;

		// stage weights
		const deck = smooth(0.4, 1, tl) * (1 - smooth(4.3, 4.9, tl)); // close-up deck shots
		const atTable = Math.max(0, 1 - Math.abs(tl - 3) / 1.6);

		// the ship rides the swell (calmer while we're filming on deck)
		const wx = anchor.position.x,
			wz = anchor.position.z;
		const fx = Math.cos(-anchor.rotation.y) * 4.5,
			fz = Math.sin(-anchor.rotation.y) * 4.5;
		const hC = waveHeight(wx, wz, time);
		const hF = waveHeight(wx + fx, wz + fz, time);
		const hB = waveHeight(wx - fx, wz - fz, time);
		const hP = waveHeight(wx - fz * 0.35, wz + fx * 0.35, time);
		const hS = waveHeight(wx + fz * 0.35, wz - fx * 0.35, time);
		const amp = 1 - deck * 0.55;
		const kk = Math.min(1, dt * 2.5);
		ship.position.y += ((hC * 0.7 + 0.05) * amp - ship.position.y) * kk;
		ship.rotation.z += (Math.atan2(hF - hB, 9) * 0.9 * amp - ship.rotation.z) * kk;
		ship.rotation.x += (Math.atan2(hP - hS, 3.2) * 0.8 * amp - ship.rotation.x) * kk;

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
		handL.set(0.45, 1.2 + sway, -0.3);
		handR.set(0.45, 1.2 - sway, 0.3);
		captain.reach([handL, handR]);
		captain.head.rotation.y = Math.sin(time * 0.3) * 0.12 + smooth(0.6, 1, tl) * (1 - smooth(1.2, 1.8, tl)) * 0.35;
		captain.head.rotation.z = Math.sin(time * 0.45) * 0.03;
		captain.coatMesh.rotation.y = Math.sin(time * 1.3) * 0.02;

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
		if (narrow) {
			// portrait: tilt so the subject sits above the text, and step back a little
			const heroW = 1 - smooth(0, 1, tl);
			const drop = Math.min(11, (vh / vw - 1) * 6) * heroW;
			ll.y -= drop * 0.35;
			const pull = 1 + 0.45 * heroW + 0.35 * (1 - heroW);
			lp.sub(ll).multiplyScalar(pull).add(ll);
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
			camPos.y + (pys * 0.35 + Math.sin(time * 0.33) * 0.06) * drift + (1 - s.follow) * waveHeight(camPos.x, camPos.z, time) * 0.15,
			camPos.z
		);
		camera.lookAt(camLook);
		const off = narrow ? 0 : s.offset;
		if (off > 0.005) camera.setViewOffset(vw, vh, -off * vw, 0, vw, vh);
		else if (camera.view) camera.clearViewOffset();

		if (composer) composer.render(dt);
		else renderer.render(scene, camera);
	}

	function loop(now) {
		raf = requestAnimationFrame(loop);
		const real = Math.min((now - last) / 1000, 0.25);
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
		ship.position.y = waveHeight(anchor.position.x, anchor.position.z, time) * 0.7 + 0.05;
	}

	return {
		renderStill() {
			frame(0.016);
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
		/** @param {{skill?: number, project?: number, projectsFrac?: number}} f */
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
			renderer.dispose();
		}
	};
}
