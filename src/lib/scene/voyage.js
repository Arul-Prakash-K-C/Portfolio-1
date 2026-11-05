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
			uLantern: { value: new THREE.Vector3() }
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
      uniform vec3 uMoonDir, uFog, uDeep, uShallow, uSky, uTeal, uMoonCol, uLantern;
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
        // Keep moon highlights as broken, local ripples instead of a continuous white trail.
        vec3 r = reflect(-v, n);
        float md = max(dot(r, uMoonDir), 0.0);
        float sparkle = step(0.985, noise(vWorld.xz * 0.72 + vec2(uTime * 0.11, -uTime * 0.07)));
        col += uMoonCol * (pow(md, 180.0) * 0.7 + pow(md, 38.0) * sparkle * 0.16);
        // warm lantern reflection from the ship
        vec3 ld = normalize(uLantern - vWorld);
        float lr = pow(max(dot(r, ld), 0.0), 120.0);
        float ldist = length(uLantern - vWorld);
        col += vec3(1.0, 0.62, 0.25) * lr * 2.0 * exp(-ldist * 0.06);
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

/**
 * A broken V wake attached to the moving hull. The two diverging foam shoulders
 * begin at the bow, soften behind the stern, and inherit the ocean's wave height.
 */
function makeWake(ship) {
	const geometry = new THREE.PlaneGeometry(26, 16, 112, 72);
	geometry.rotateX(-Math.PI / 2);
	const position = geometry.attributes.position;
	for (let i = 0; i < position.count; i++) position.setX(i, position.getX(i) - 7);
	position.needsUpdate = true;
	geometry.computeVertexNormals();
	const material = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		side: THREE.DoubleSide,
		uniforms: { uTime: { value: 0 } },
		vertexShader: /* glsl */ `
			uniform float uTime;
			varying vec2 vLocal;
			varying vec3 vWorld;
			float oceanY(vec2 p) {
				return sin(dot(normalize(vec2(1.0,.25)),p)*.3927-uTime*.66)*.56
				 + sin(dot(normalize(vec2(.6,.8)),p)*.6981-uTime*.54)*.26
				 + sin(dot(normalize(vec2(-.3,1.0)),p)*1.1424-uTime*.43)*.12;
			}
			void main(){
				vLocal = position.xz;
				vec4 world = modelMatrix * vec4(position, 1.0);
				world.y += oceanY(world.xz) + .045;
				vWorld = world.xyz;
				gl_Position = projectionMatrix * viewMatrix * world;
			}`,
		fragmentShader: /* glsl */ `
			uniform float uTime;
			varying vec2 vLocal;
			varying vec3 vWorld;
			float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
			float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
				return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
			void main(){
				float aft = clamp((6.2-vLocal.x)/20.5,0.,1.);
				float ends = smoothstep(0.,.07,aft)*(1.-smoothstep(.82,1.,aft));
				float halfWidth = .85 + aft*4.7;
				float broken = noise(vLocal*vec2(2.6,4.2)+vec2(-uTime*.34,uTime*.19));
				float grain = noise(vLocal*vec2(7.0,10.0)+vec2(-uTime*.55,uTime*.36));
				float shoulder = exp(-pow((abs(vLocal.y)-halfWidth)/(.22+aft*.36),2.));
				float bowSplit = exp(-pow((vLocal.x-5.5)/.7,2.))*exp(-pow((abs(vLocal.y)-.93)/.42,2.));
				float hullShear = exp(-pow((abs(vLocal.y)-.92)/.23,2.))*smoothstep(-5.4,-2.2,vLocal.x);
				float sternChurn = exp(-pow((vLocal.x+6.2)/2.1,2.))*exp(-pow(vLocal.y/1.3,2.));
				float fleck = smoothstep(.36,.8,grain);
				float breakup = mix(.28,1.,smoothstep(.18,.75,broken));
				float alpha = (shoulder*.42*ends*mix(.42,1.,fleck) + bowSplit*.43 + hullShear*.16 + sternChurn*.2*mix(.45,1.,broken))*breakup;
				alpha *= smoothstep(.02,.22,grain);
				vec3 foam = mix(vec3(.36,.48,.55),vec3(.78,.82,.79),smoothstep(.42,.88,grain));
				gl_FragColor = vec4(foam, clamp(alpha,0.,.52));
			}`
	});
	// The foam is a close surface treatment, not a long white stripe on the sea.
	const mesh = new THREE.Mesh(geometry, material);
	mesh.renderOrder = 1;
	ship.add(mesh);
	return { mesh, mat: material };
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
		antialias: true,
		alpha: false,
		powerPreference: 'high-performance'
	});
	// High-density displays can render up to 3840×2160 at a 1920×1080 viewport.
	const dpr = Math.min(window.devicePixelRatio || 1, low ? 1.25 : 2);
	renderer.setPixelRatio(dpr);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.15;
	renderer.setClearColor(FOG);

	const scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(FOG, 0.0095);
	const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1200);

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

	// Lighting: cold moon key from behind, cool sky fill, warm low fill from the viewer side
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

	const g = makeGalleon();
	const ship = g.ship;
	ship.scale.setScalar(1);
	ship.position.set(10.5, 0, -11);
	ship.rotation.y = -0.32;
	scene.add(ship);
	const wake = makeWake(ship);
	const lanternWorld = new THREE.Vector3();

	/* post-processing (desktop / capable devices only) */
	let composer = null;
	let film = null;
	if (!low) {
		composer = new EffectComposer(renderer);
		composer.setPixelRatio(dpr);
		composer.addPass(new RenderPass(scene, camera));
		const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.55, 0.78);
		composer.addPass(bloom);
		film = new ShaderPass(FilmShader);
		composer.addPass(film);
		composer.addPass(new OutputPass());
	}

	// Camera keyframes along the hero scroll: low wide shot → along the hull → up the masts to the stars
	const keys = [
		{ p: 0, pos: new THREE.Vector3(-2, 2.4, 19), look: new THREE.Vector3(6.5, 5.2, -9) },
		{ p: 0.55, pos: new THREE.Vector3(3.5, 2.6, 11), look: new THREE.Vector3(11, 5.0, -11) },
		{ p: 1, pos: new THREE.Vector3(5, 5, 9), look: new THREE.Vector3(11, 22, -34) }
	];
	const tmpPos = new THREE.Vector3();
	const tmpLook = new THREE.Vector3();

	let scroll = 0,
		scrollSmooth = 0;
	let px = 0,
		py = 0,
		pxs = 0,
		pys = 0;
	let lookShift = 0;
	let lookDrop = 0;
	let pullBack = 1;
	let raf = 0,
		running = false,
		last = performance.now(),
		time = 0;

	function resize() {
		const w = canvas.clientWidth || window.innerWidth;
		const h = canvas.clientHeight || window.innerHeight;
		renderer.setSize(w, h, false);
		composer?.setSize(w, h);
		film?.uniforms.uRes.value.set(w * dpr, h * dpr);
		camera.aspect = w / h;
		const narrow = w / h < 0.9;
		camera.fov = narrow ? 50 : 34;
		lookShift = narrow ? 4.6 : w / h < 1.3 ? 2 : 0;
		// tall portrait heroes: tilt down so the ship sits above the text
		lookDrop = narrow ? Math.min(11, (h / w - 1) * 6) : 0;
		pullBack = narrow ? 1.45 : 1;
		camera.updateProjectionMatrix();
	}

	function frame(dt) {
		time += dt;
		scrollSmooth += (scroll - scrollSmooth) * Math.min(1, dt * 4);
		pxs += (px - pxs) * Math.min(1, dt * 2.5);
		pys += (py - pys) * Math.min(1, dt * 2.5);

		ocean.mat.uniforms.uTime.value = time;
		wake.mat.uniforms.uTime.value = time;
		sky.mat.uniforms.uTime.value = time;
		stars.mat.uniforms.uTime.value = time;
		motes.mat.uniforms.uTime.value = time;
		fog.mat.uniforms.uTime.value = time;
		if (film) film.uniforms.uTime.value = time;

		// the ship rides the swell: sample four points under the hull
		const bx = ship.position.x,
			bz = ship.position.z;
		const fx = Math.cos(-ship.rotation.y) * 4.5,
			fz = Math.sin(-ship.rotation.y) * 4.5;
		const hC = waveHeight(bx, bz, time);
		const hF = waveHeight(bx + fx, bz + fz, time);
		const hB = waveHeight(bx - fx, bz - fz, time);
		const hP = waveHeight(bx - fz * 0.35, bz + fx * 0.35, time);
		const hS = waveHeight(bx + fz * 0.35, bz - fx * 0.35, time);
		ship.position.y += (hC * 0.7 + 0.05 - ship.position.y) * Math.min(1, dt * 3);
		ship.rotation.z += (Math.atan2(hF - hB, 9) * 0.9 - ship.rotation.z) * Math.min(1, dt * 2.5);
		ship.rotation.x += (Math.atan2(hP - hS, 3.2) * 0.8 - ship.rotation.x) * Math.min(1, dt * 2.5);

		// canvas breathes, pennant streams
		for (let i = 0; i < g.sails.length; i++) {
			g.sails[i].scale.x = 1 + Math.sin(time * 1.1 + i * 0.7) * 0.1;
		}
		const fp = g.pennant.geometry.attributes.position;
		for (let i = 0; i < fp.count; i++) {
			const x = fp.getX(i);
			fp.setZ(i, Math.sin(time * 5 - x * 3.2) * 0.12 * x);
		}
		fp.needsUpdate = true;

		g.captain.sprite.position.y = g.captain.baseY + Math.sin(time * 1.25) * 0.025;
		g.captain.sprite.rotation.z = Math.sin(time * 0.72) * 0.008;
		g.lanternLight.intensity = 8.5 + Math.sin(time * 7) * 0.6 + Math.sin(time * 13) * 0.35;
		g.lanternLight.getWorldPosition(lanternWorld);
		ocean.mat.uniforms.uLantern.value.copy(lanternWorld);

		// camera
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
		tmpLook.y -= lookDrop;
		if (pullBack !== 1) tmpPos.sub(tmpLook).multiplyScalar(pullBack).add(tmpLook);
		// slow handheld drift + pointer parallax
		camera.position.set(
			tmpPos.x + pxs * 0.8 + Math.sin(time * 0.21) * 0.15,
			tmpPos.y + pys * 0.35 + Math.sin(time * 0.33) * 0.08 + waveHeight(tmpPos.x, tmpPos.z, time) * 0.15,
			tmpPos.z
		);
		camera.lookAt(tmpLook);

		if (composer) composer.render(dt);
		else renderer.render(scene, camera);
	}

	function loop(now) {
		const dt = Math.min((now - last) / 1000, 0.05);
		last = now;
		frame(dt);
		raf = requestAnimationFrame(loop);
	}

	resize();
	// settle the ship onto the water before the first visible frame
	for (let i = 0; i < 40; i++) {
		time += 0.05;
		const hC = waveHeight(ship.position.x, ship.position.z, time);
		ship.position.y = hC * 0.7 + 0.05;
	}

	return {
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
		setScroll(p) {
			scroll = p;
			if (!running) scrollSmooth = p;
		},
		setPointer(x, y) {
			px = x;
			py = y;
		},
		resize,
		dispose() {
			this.stop();
			scene.traverse((o) => {
				if (o === g.captain.sprite) return;
				if (o.geometry) o.geometry.dispose();
				if (o.material) {
					const mats = Array.isArray(o.material) ? o.material : [o.material];
					for (const m of mats) {
						for (const k of ['map', 'alphaMap']) m[k]?.dispose?.();
						m.dispose();
					}
				}
			});
			g.captain.dispose();
			composer?.dispose?.();
			renderer.dispose();
		}
	};
}
