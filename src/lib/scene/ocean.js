// @ts-nocheck — three ships no bundled types; this file is checked by running it.
/**
 * The sea: a Gerstner-wave ocean the ship actually sails through.
 *
 * - Deep-water dispersion (ω = √(gk)), so long swells travel faster than chop.
 * - The water flows past the hull (`flow`), so the ship reads as under way.
 * - The water inside the hull's waterline is cut away, so waves never poke
 *   through the deck; foam hugs the hull, a bow wave curls off the stem and
 *   a Kelvin wake (19.5° arms + a turbulent centre track) trails astern.
 * - On capable devices a planar reflection of the scene (ship, lanterns,
 *   moon, sky) is distorted by the wave normals.
 * - Bow spray: GPU particles thrown up when the bow buries into a swell.
 */
import * as THREE from 'three';
import { hullPoint } from './galleon.js';

export const SAIL_SPEED = 2.4; // metres per second, the ship's speed through the water

/* ------------------------------------------------------------------ */
/* Wave spectrum                                                       */
/* ------------------------------------------------------------------ */
// dirX, dirZ, steepness, wavelength. Total steepness < 1 keeps crests from looping.
const WAVES = [
	[1.0, 0.22, 0.085, 26],
	[0.78, 0.62, 0.09, 15],
	[-0.15, 1.0, 0.1, 9.5],
	[0.95, -0.35, 0.09, 6.1],
	[-0.65, -0.4, 0.07, 3.9],
	[0.35, -1.0, 0.055, 2.6],
	[0.88, 0.5, 0.045, 1.7],
	[-0.4, 0.9, 0.035, 1.15]
];
const TIME_SCALE = 0.8; // slightly slow the sea for a heavier, cinematic feel
const SPEC = WAVES.map(([dx, dz, st, l]) => {
	const len = Math.hypot(dx, dz);
	const k = (2 * Math.PI) / l;
	return { dx: dx / len, dz: dz / len, st, k, a: st / k, w: Math.sqrt(9.8 * k) * TIME_SCALE };
});

/**
 * Surface height at world (x, z). Includes the Gerstner horizontal shift
 * (one fixed-point step), so floating objects sit on the rendered surface.
 */
export function waveHeight(x, z, t, flow) {
	const fx = flow ? flow.x : 0,
		fz = flow ? flow.y : 0;
	// undo the horizontal displacement once: find the grid point that lands on (x, z)
	let px = x + fx,
		pz = z + fz;
	for (let it = 0; it < 2; it++) {
		let sx = 0,
			sz = 0;
		for (const w of SPEC) {
			const f = w.k * (w.dx * px + w.dz * pz) - t * w.w;
			const c = Math.cos(f);
			sx += w.dx * w.a * c;
			sz += w.dz * w.a * c;
		}
		px = x + fx - sx;
		pz = z + fz - sz;
	}
	let y = 0;
	for (const w of SPEC) y += w.a * Math.sin(w.k * (w.dx * px + w.dz * pz) - t * w.w);
	return y;
}

const glslWaves = SPEC.map(
	(w) => `{ vec2 d = vec2(${w.dx.toFixed(5)}, ${w.dz.toFixed(5)});
      float f = ${w.k.toFixed(5)} * dot(d, p) - uTime * ${w.w.toFixed(5)};
      float c = cos(f), s = sin(f);
      disp += vec3(d.x * ${w.a.toFixed(5)} * c, ${w.a.toFixed(5)} * s, d.y * ${w.a.toFixed(5)} * c);
      tang += vec3(-d.x * d.x * ${w.st.toFixed(5)} * s, d.x * ${w.st.toFixed(5)} * c, -d.x * d.y * ${w.st.toFixed(5)} * s);
      bin  += vec3(-d.x * d.y * ${w.st.toFixed(5)} * s, d.y * ${w.st.toFixed(5)} * c, -d.y * d.y * ${w.st.toFixed(5)} * s);
      jac  -= ${w.st.toFixed(5)} * s; }`
).join('\n');

/* ------------------------------------------------------------------ */
/* The hull's waterline, as a half-width table along the keel          */
/* ------------------------------------------------------------------ */
export const HULL_N = 48;
export const HULL_X0 = -6.6;
export const HULL_X1 = 6.4;
function hullWaterline() {
	// sample the hull where it crosses y = 0 (the design waterline)
	const pts = [];
	for (let i = 0; i <= 120; i++) {
		const t = i / 120;
		let lo = 0,
			hi = 1;
		for (let it = 0; it < 30; it++) {
			const mid = (lo + hi) / 2;
			if (hullPoint(t, mid, 1).y > 0) lo = mid;
			else hi = mid;
		}
		const p = hullPoint(t, (lo + hi) / 2, 1);
		pts.push([p.x, Math.abs(p.z)]);
	}
	pts.sort((a, b) => a[0] - b[0]);
	const table = new Float32Array(HULL_N + 1);
	for (let i = 0; i <= HULL_N; i++) {
		const x = HULL_X0 + ((HULL_X1 - HULL_X0) * i) / HULL_N;
		let hw = 0;
		for (let j = 0; j < pts.length - 1; j++) {
			const [x0, z0] = pts[j],
				[x1, z1] = pts[j + 1];
			if (x >= x0 && x <= x1) {
				hw = z0 + ((z1 - z0) * (x - x0)) / Math.max(x1 - x0, 1e-4);
				break;
			}
		}
		table[i] = hw;
	}
	return table;
}

/* ------------------------------------------------------------------ */
/* Ocean surface                                                       */
/* ------------------------------------------------------------------ */
const NOISE = /* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.07 + 3.1; a *= 0.5; } return s; }
`;

const HULL_GLSL = /* glsl */ `
  uniform float uHull[${HULL_N + 1}];
  uniform vec3 uShipPos;
  uniform vec2 uShipDir;
  // ship-local (x along the keel toward the bow, y across to starboard)
  vec2 shipLocal(vec2 w){ vec2 r = w - uShipPos.xz; return vec2(dot(r, uShipDir), dot(r, vec2(-uShipDir.y, uShipDir.x))); }
  float hullHalf(float x){
    float u = (x - ${HULL_X0.toFixed(3)}) / ${(HULL_X1 - HULL_X0).toFixed(3)} * ${HULL_N.toFixed(1)};
    if (u <= 0.0 || u >= ${HULL_N.toFixed(1)}) return 0.0;
    int i = int(floor(u));
    return mix(uHull[i], uHull[i + 1], fract(u));
  }
`;

export function makeOcean(segments, { fog, moonDir, reflections }) {
	// denser grid near the ship, coarser toward the horizon
	const geo = new THREE.PlaneGeometry(1, 1, segments, segments);
	geo.rotateX(-Math.PI / 2);
	const pa = geo.attributes.position;
	for (let i = 0; i < pa.count; i++) {
		const x = pa.getX(i) * 2,
			z = pa.getZ(i) * 2; // -1..1
		const r = Math.hypot(x, z);
		const s = r > 0 ? (Math.pow(r, 2.2) * 300 + r * 40) / r : 0;
		pa.setX(i, x * s);
		pa.setZ(i, z * s);
	}
	const mat = new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uFlow: { value: new THREE.Vector2() },
			uMoonDir: { value: moonDir.clone() },
			uFog: { value: fog },
			uFogD: { value: 0.0095 },
			uDeep: { value: new THREE.Color('#02060d') },
			uScatter: { value: new THREE.Color('#0f3b4a') },
			uSky: { value: new THREE.Color('#1a2f4f') },
			uMoonCol: { value: new THREE.Color('#ffeccc') },
			uLantern: { value: new THREE.Vector3() },
			uBeacon: { value: new THREE.Vector3() },
			uBeaconI: { value: 0 },
			uHull: { value: hullWaterline() },
			uShipPos: { value: new THREE.Vector3() },
			uShipDir: { value: new THREE.Vector2(1, 0) },
			uSpeed: { value: SAIL_SPEED },
			uWake: { value: 0 },
			uBowSurge: { value: 0 },
			uRefl: { value: null },
			uReflOn: { value: reflections ? 1 : 0 },
			uReflMat: { value: new THREE.Matrix4() }
		},
		vertexShader: /* glsl */ `
      uniform float uTime, uWake, uBowSurge;
      uniform vec2 uFlow;
      ${HULL_GLSL}
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vFold;
      varying vec2 vLocal;
      void main() {
        vec3 pos = (modelMatrix * vec4(position, 1.0)).xyz;
        vec2 p = pos.xz + uFlow;
        vec3 disp = vec3(0.0);
        vec3 tang = vec3(1.0, 0.0, 0.0);
        vec3 bin = vec3(0.0, 0.0, 1.0);
        float jac = 1.0;
        // fade the shortest waves with distance (they alias), keep the swell to the horizon
        float fade = 1.0 - smoothstep(90.0, 260.0, length(pos.xz - cameraPosition.xz));
        ${glslWaves}
        pos += disp * mix(0.35, 1.0, fade);
        // the hull displaces the water: the stem divides it, a bow crest runs out
        // and aft along both sides, a trough sits amidships, a quarter wave rises
        // at the stern, and diverging wake waves spread in a V behind
        vec2 q = shipLocal(pos.xz);
        float hwC = max(hullHalf(clamp(q.x, ${HULL_X0.toFixed(2)}, ${HULL_X1.toFixed(2)})), 0.0);
        float ay = abs(q.y);
        float side = ay - hwC;
        float surge = uWake * (1.0 + uBowSurge * 0.8);
        // bow crest: starts at the stem, flares outward as it runs aft
        float sbv = 6.3 - q.x;
        float crestLine = hwC + 0.12 + max(sbv, 0.0) * 0.2;
        float crestBreak = 0.65 + 0.35 * sin(sbv * 1.9 + q.y * 0.7 + uTime * 0.6);
        float crest = exp(-pow((ay - crestLine) / (0.75 + max(sbv, 0.0) * 0.1), 2.0)) * smoothstep(-0.4, 0.6, sbv) * exp(-max(sbv, 0.0) * 0.3) * crestBreak;
        float pile = exp(-pow((q.x - 6.0) / 0.9, 2.0)) * exp(-max(side, 0.0) * 2.2); // water piled at the stem
        float trough = exp(-pow((q.x + 0.3) / 3.0, 2.0)) * exp(-max(side, 0.0) * 1.0);
        float quarter = exp(-pow((q.x + 6.4) / 1.3, 2.0)) * exp(-max(side, 0.0) * 1.1);
        // diverging (Kelvin) wave trains inside a 19.5° V from the bow, fading astern
        float inV = smoothstep(0.0, 1.5, sbv * 0.354 + 0.4 - ay) * step(0.0, sbv);
        float div = sin(sbv * 1.35 - ay * 2.6) * inV * smoothstep(5.5, 9.0, sbv) * exp(-max(sbv - 9.0, 0.0) * 0.035);
        pos.y += (crest * 0.22 + pile * 0.22 - trough * 0.14 + quarter * 0.12 + div * 0.05) * surge;
        vNormal = normalize(mix(vec3(0.0, 1.0, 0.0), cross(bin, tang), fade * 0.85 + 0.15));
        vFold = 1.0 - jac;
        vLocal = q;
        vWorld = pos;
        gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
      }`,
		fragmentShader: /* glsl */ `
      uniform float uTime, uBeaconI, uFogD, uSpeed, uWake, uReflOn, uBowSurge;
      uniform vec2 uFlow;
      uniform vec3 uMoonDir, uFog, uDeep, uScatter, uSky, uMoonCol, uLantern, uBeacon;
      uniform sampler2D uRefl;
      uniform mat4 uReflMat;
      ${HULL_GLSL}
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vFold;
      varying vec2 vLocal;
      ${NOISE}
      void main() {
        vec2 q = shipLocal(vWorld.xz);
        float hw = hullHalf(q.x);
        // the water inside the hull's waterline isn't drawn: no sea on the deck
        if (hw > 0.0 && abs(q.y) < hw - 0.03) discard;
        float side = abs(q.y) - hw;

        float dist = length(vWorld - cameraPosition);
        vec2 sp = vWorld.xz + uFlow; // sea-space: features drift past the ship
        // detail normals: two layers of capillary chop, flattened with distance
        float detail = 1.0 - smoothstep(20.0, 120.0, dist);
        vec2 r1 = sp * 0.9 + vec2(uTime * 0.35, uTime * 0.2);
        vec2 r2 = sp * 2.7 - vec2(uTime * 0.6, -uTime * 0.45);
        vec2 dn = vec2(fbm(r1) - fbm(r1 + 7.3), fbm(r1 + 3.1) - fbm(r1 + 11.7)) * 0.5
                + vec2(noise(r2) - noise(r2 + 5.2), noise(r2 + 9.4) - noise(r2 + 1.3)) * 0.35;
        vec3 n = normalize(vNormal + vec3(dn.x, 0.0, dn.y) * detail);

        vec3 v = normalize(cameraPosition - vWorld);
        float ndv = max(dot(n, v), 0.0);
        float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);

        // body colour: deep water, plus light scattered through the thin crests
        float crest = clamp(vWorld.y * 0.9 + 0.3, 0.0, 1.0);
        vec3 body = uDeep + uScatter * pow(crest, 2.0) * (0.35 + 0.65 * max(dot(-v, uMoonDir) * 0.5 + 0.5, 0.0));

        // reflection: the rendered scene mirrored in the sea, or the sky colour on small screens
        vec3 r = reflect(-v, n);
        vec3 refl = mix(uSky * 0.6, uSky, smoothstep(0.0, 0.4, r.y));
        if (uReflOn > 0.5) {
          vec4 rc = uReflMat * vec4(vWorld, 1.0);
          vec2 ruv = rc.xy / rc.w + n.xz * 0.028 * (0.4 + detail);
          vec3 sc = texture2D(uRefl, clamp(ruv, 0.001, 0.999)).rgb;
          refl = mix(refl, sc, 0.92);
        }
        vec3 col = mix(body, refl, clamp(fres * 1.35 + 0.03, 0.0, 1.0));

        // moon glitter path + broad sheen
        float md = max(dot(r, uMoonDir), 0.0);
        // churned water around the hull scatters the glint instead of mirroring it
        float churn = exp(-max(abs(q.y) - max(hw, 0.0), 0.0) * 0.25) * smoothstep(-14.0, -2.0, -abs(q.x + 2.0) + 6.0) + smoothstep(0.0, 1.5, (6.3 - q.x) * 0.354 + 0.4 - abs(q.y)) * step(6.3, 6.3 - q.x + 6.3) * exp(-max(6.3 - q.x - 12.0, 0.0) * 0.03);
        float glint = 1.0 - 0.75 * clamp(churn, 0.0, 1.0);
        col += uMoonCol * (pow(md, 600.0) * 4.0 * glint + pow(md, 60.0) * 0.35 * glint + pow(md, 8.0) * 0.04);
        // warm lantern on the water
        vec3 ld = normalize(uLantern - vWorld);
        float ldist = length(uLantern - vWorld);
        col += vec3(1.0, 0.62, 0.25) * (pow(max(dot(r, ld), 0.0), 90.0) * 2.2 + 0.05) * exp(-ldist * 0.11);
        // the island beacon's long reflection once it is lit
        vec3 bd = normalize(uBeacon - vWorld);
        col += vec3(1.0, 0.6, 0.25) * pow(max(dot(r, bd), 0.0), 60.0) * 2.5 * uBeaconI;

        /* ---------------- foam ---------------- */
        // whitecaps where the open sea folds (Gerstner jacobian)
        float cap = smoothstep(0.62, 0.92, vFold) * smoothstep(0.58, 0.78, fbm(sp * 0.9 + uTime * 0.12)) * smoothstep(0.4, 0.7, fbm(sp * 3.3 - uTime * 0.2));
        // foam lives in the ship's frame and is carried aft at sailing speed
        vec2 fq = vec2(q.x + uTime * uSpeed, q.y);
        // irregular patches: two octaves of thresholded noise, never a solid band
        float lace = fbm(fq * vec2(0.8, 1.1) + 4.0);
        float fine = fbm(fq * 3.1 + vec2(0.0, uTime * 0.3));
        float patchy = smoothstep(0.42, 0.68, lace * 0.75 + fine * 0.45);
        float ay = abs(q.y);
        float sbv = 6.3 - q.x;
        float bowness = smoothstep(0.5, 6.0, q.x);
        float surge = 1.0 + uBowSurge * 0.9;
        // contact foam: thin, turbulent, hugging the hull, thickest where the stem cuts in
        float contact = (1.0 - smoothstep(0.0, 0.18 + bowness * 0.5 * surge, side)) * step(0.001, hw) * (0.45 + bowness * 0.9); // only alongside the hull itself
        // the bow crest breaking as it runs aft along both sides
        float crestLine = max(hw, 0.0) + 0.12 + max(sbv, 0.0) * 0.2;
        float crestF = exp(-pow((ay - crestLine) / (0.3 + max(sbv, 0.0) * 0.08), 2.0)) * smoothstep(-0.3, 0.5, sbv) * exp(-max(sbv, 0.0) * 0.42) * surge;
        // wake: a broad V behind the ship; turbulent near the stern, breaking into
        // patches and fading with distance; densest just inside the V edges
        float edge = sbv * 0.354 + 0.4;
        float inV = smoothstep(0.0, 1.8, edge - ay) * smoothstep(9.0, 13.5, sbv);
        float rim = exp(-pow((edge - ay - 0.9) / (0.9 + sbv * 0.04), 2.0));
        float sternS = -6.1 - q.x;
        float prop = sternS > 0.0 ? (1.0 - smoothstep(0.0, 1.4 + sternS * 0.1, ay)) * exp(-sternS * 0.05) : 0.0;
        float wakeEnv = (inV * (0.25 + rim * 0.75) + prop) * exp(-max(sbv - 12.0, 0.0) * 0.03);
        float wake = clamp(contact + crestF * 0.8 + wakeEnv * 0.75, 0.0, 1.2) * uWake;
        float foam = clamp(cap * 0.45 + wake * patchy + contact * fine * 0.35 * uWake, 0.0, 1.0);
        float lit = 0.35 + 0.65 * max(dot(n, uMoonDir), 0.0);
        vec3 foamCol = vec3(0.66, 0.72, 0.78) * lit + vec3(1.0, 0.62, 0.3) * exp(-ldist * 0.18) * 0.5;
        col = mix(col, foamCol, foam * 0.62);
        // aerated water under and around the foam is paler and greener
        col += uScatter * wake * (0.18 + 0.2 * lace);

        // atmospheric fog (matches scene.fog's exp2)
        float f = 1.0 - exp(-uFogD * uFogD * dist * dist);
        col = mix(col, uFog, clamp(f, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }`
	});
	const mesh = new THREE.Mesh(geo, mat);
	mesh.frustumCulled = false;
	return { mesh, mat };
}

/* ------------------------------------------------------------------ */
/* Planar reflection                                                   */
/* ------------------------------------------------------------------ */
export function makeReflection(scale = 0.5) {
	const rt = new THREE.WebGLRenderTarget(256, 256, { type: THREE.HalfFloatType, samples: 0 });
	const cam = new THREE.PerspectiveCamera();
	const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.02);
	const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
	const mirror = new THREE.Matrix4().makeScale(1, -1, 1);
	const texMat = new THREE.Matrix4();
	return {
		rt,
		texMat,
		setSize(w, h) {
			rt.setSize(Math.max(64, Math.round(w * scale)), Math.max(64, Math.round(h * scale)));
		},
		/** render `scene` as seen in a mirror at y = 0, skipping `hide` objects */
		render(renderer, scene, camera, hide) {
			camera.updateMatrixWorld();
			// mirrored camera: reflect the world matrix through the water plane
			cam.matrixWorld.copy(mirror).multiply(camera.matrixWorld);
			// keep a right-handed basis: flip the camera's local y back so winding stays correct
			cam.matrixWorld.multiply(new THREE.Matrix4().makeScale(1, -1, 1));
			cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
			cam.projectionMatrix.copy(camera.projectionMatrix);
			cam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
			cam.matrixAutoUpdate = false;
			texMat.copy(bias).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
			for (const o of hide) o.visible = false;
			const prevClip = renderer.clippingPlanes;
			renderer.clippingPlanes = [plane];
			const prevRT = renderer.getRenderTarget();
			renderer.setRenderTarget(rt);
			renderer.clear();
			renderer.render(scene, cam);
			renderer.setRenderTarget(prevRT);
			renderer.clippingPlanes = prevClip;
			for (const o of hide) o.visible = true;
		},
		dispose() {
			rt.dispose();
		}
	};
}

/* ------------------------------------------------------------------ */
/* Bow spray and side splashes                                          */
/* ------------------------------------------------------------------ */
/**
 * Particles live in ship space and are animated on the GPU: each one is born
 * at the stem or along the bow flare, flies out and up, falls under gravity
 * and drifts aft as the ship sails past it. `uPower` (0..1) is driven by how
 * hard the bow is plunging into the swell.
 */
export function makeSpray(count) {
	const seed = new Float32Array(count * 4);
	const pos = new Float32Array(count * 3);
	for (let i = 0; i < count; i++) {
		seed[i * 4] = Math.random(); // phase
		seed[i * 4 + 1] = Math.random(); // where along the bow
		seed[i * 4 + 2] = Math.random() < 0.5 ? -1 : 1; // side
		seed[i * 4 + 3] = Math.random(); // size / speed
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
	geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(3, 1, 0), 14);
	const mat = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		uniforms: {
			uTime: { value: 0 },
			uPx: { value: 1 },
			uPower: { value: 0 },
			uSpeed: { value: SAIL_SPEED },
			uLantern: { value: new THREE.Vector3() },
			uMoonDir: { value: new THREE.Vector3(0, 1, 0) }
		},
		vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      uniform float uTime, uPx, uPower, uSpeed;
      varying float vA;
      varying float vMist;
      void main(){
        float life = 0.55 + aSeed.w * 0.5;
        float age = mod(uTime + aSeed.x * life * 7.0, life);
        float k = age / life;
        // birth point: along the bow flare, from the stem back ~3 m
        float along = aSeed.y;
        float bx = 5.9 - along * 3.2;
        float bz = aSeed.z * (0.3 + along * 1.15);
        vec3 p0 = vec3(bx, 0.05, bz);
        // thrown off the bow crest: low, outward and short-lived; mist drifts and fades
        float mist = step(0.85, aSeed.w);
        vec3 vel = vec3(0.3 - along * 0.3, 0.8 + aSeed.w * 1.4 * (1.0 - along * 0.6), aSeed.z * (0.7 + aSeed.w * 1.1));
        vel *= mix(1.0, 0.45, mist);
        vec3 p = p0 + vel * age + vec3(-uSpeed * age, -4.9 * age * age * mix(1.0, 0.2, mist), 0.0);
        p.y = max(p.y, -0.1);
        vA = (1.0 - k) * smoothstep(0.0, 0.08, k) * uPower * (0.5 + 0.5 * aSeed.y);
        vMist = mist;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float size = mix(0.035 + aSeed.w * 0.05, 0.6 + aSeed.w * 0.5, mist) * (1.0 + k * 1.5);
        gl_PointSize = clamp(size * uPx * 600.0 / -mv.z, 1.0, 120.0);
        gl_Position = projectionMatrix * mv;
      }`,
		fragmentShader: /* glsl */ `
      varying float vA;
      varying float vMist;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = mix(smoothstep(0.5, 0.15, d), smoothstep(0.5, 0.0, d) * 0.18, vMist);
        gl_FragColor = vec4(vec3(0.82, 0.88, 0.95), a * vA * 0.75);
      }`
	});
	const points = new THREE.Points(geo, mat);
	points.frustumCulled = false;
	return { points, mat };
}
