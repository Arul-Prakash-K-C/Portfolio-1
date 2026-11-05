<!--
  The screen "glass" taking the captain's flintlock ball on the left side.
  Listens for the scene's `captain-shot` window event, then draws a
  procedural fracture: a small hole, branching radial cracks, a few
  spiderweb rings, a sheen of reflected light and a handful of falling
  shards. Purely decorative (aria-hidden, pointer-events: none), thin
  enough that the About text stays readable, and skipped entirely for
  reduced motion.
-->
<script>
	import { onMount } from 'svelte';

	/** @type {{ d: string, w: number, delay: number, len: number }[]} */
	let cracks = $state([]);
	/** @type {{ pts: string, x: number, y: number, dx: number, dy: number, r: number, delay: number }[]} */
	let shards = $state([]);
	let hit = $state({ x: 0, y: 0 });
	let playing = $state(false);
	let key = $state(0);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;

	/** seeded random so each shot differs but stays deterministic within itself */
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

	/** @param {number} cx @param {number} cy @param {number} seed */
	function fracture(cx, cy, seed) {
		const r = rng(seed);
		const vw = window.innerWidth,
			vh = window.innerHeight;
		const reach = Math.min(Math.max(vw, vh) * 0.42, 620);
		/** @type {{ d: string, w: number, delay: number, len: number }[]} */
		const out = [];
		const spokes = 11 + Math.floor(r() * 4);
		/** @type {[number, number][][]} */
		const spokePts = [];
		for (let i = 0; i < spokes; i++) {
			const a0 = (i / spokes) * Math.PI * 2 + (r() - 0.5) * 0.35;
			const len = reach * (0.45 + r() * 0.55);
			/** @type {[number, number][]} */
			const pts = [[cx, cy]];
			let a = a0,
				d = 0;
			while (d < len) {
				const step = 14 + r() * 34;
				d += step;
				a += (r() - 0.5) * 0.28;
				pts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d]);
				// branches peel off the main crack
				if (d > 40 && r() < 0.16) {
					const ba = a + (r() < 0.5 ? -1 : 1) * (0.35 + r() * 0.5);
					const bl = 30 + r() * (len - d) * 0.6;
					let bx = pts[pts.length - 1][0],
						by = pts[pts.length - 1][1],
						bd = 0,
						bb = ba;
					let bp = `M${bx.toFixed(1)} ${by.toFixed(1)}`;
					while (bd < bl) {
						const st = 10 + r() * 22;
						bd += st;
						bb += (r() - 0.5) * 0.4;
						bx += Math.cos(bb) * st;
						by += Math.sin(bb) * st;
						bp += ` L${bx.toFixed(1)} ${by.toFixed(1)}`;
					}
					out.push({ d: bp, w: 0.6 + r() * 0.5, delay: 60 + d * 0.35, len: bl + 20 });
				}
			}
			spokePts.push(pts);
			out.push({ d: 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L'), w: 0.9 + r() * 0.9, delay: 0, len: len + 40 });
		}
		// spiderweb rings: short, slightly sagging links between neighbouring spokes
		for (const ringR of [26 + r() * 10, 60 + r() * 25, 120 + r() * 50]) {
			for (let i = 0; i < spokes; i++) {
				if (r() < 0.25) continue;
				const A = spokePts[i],
					B = spokePts[(i + 1) % spokes];
				const pa = A.find(([x, y]) => Math.hypot(x - cx, y - cy) >= ringR);
				const pb = B.find(([x, y]) => Math.hypot(x - cx, y - cy) >= ringR);
				if (!pa || !pb) continue;
				const mx = (pa[0] + pb[0]) / 2,
					my = (pa[1] + pb[1]) / 2;
				const sag = 0.82 + r() * 0.1;
				const qx = cx + (mx - cx) * sag,
					qy = cy + (my - cy) * sag;
				out.push({ d: `M${pa[0].toFixed(1)} ${pa[1].toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${pb[0].toFixed(1)} ${pb[1].toFixed(1)}`, w: 0.5 + r() * 0.5, delay: 80 + ringR * 0.6, len: 260 });
			}
		}
		// a few shards break free near the hole and fall away
		/** @type {{ pts: string, x: number, y: number, dx: number, dy: number, r: number, delay: number }[]} */
		const sh = [];
		for (let i = 0; i < 7; i++) {
			const a = r() * Math.PI * 2,
				dist = 8 + r() * 46;
			const s = 5 + r() * 12;
			const n = 3 + Math.floor(r() * 2);
			const pts = Array.from({ length: n }, (_, k) => {
				const t = (k / n) * Math.PI * 2 + r() * 0.8;
				return `${(Math.cos(t) * s * (0.5 + r())).toFixed(1)},${(Math.sin(t) * s * (0.5 + r())).toFixed(1)}`;
			}).join(' ');
			sh.push({ pts, x: cx + Math.cos(a) * dist, y: cy + Math.sin(a) * dist, dx: Math.cos(a) * (30 + r() * 80), dy: 180 + r() * 260, r: (r() - 0.5) * 540, delay: r() * 120 });
		}
		return { out, sh, vw, vh };
	}

	let vb = $state('0 0 1 1');

	onMount(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		const onShot = (/** @type {Event} */ e) => {
			if (reduced.matches) return;
			const detail = /** @type {CustomEvent} */ (e).detail || {};
			const vw = window.innerWidth,
				vh = window.innerHeight;
			// the ball lands on the left of the screen, over the About column
			const x = detail.x ?? vw * (vw < 760 ? 0.3 : 0.2),
				y = detail.y ?? vh * 0.4;
			const f = fracture(x, y, Math.floor(Math.random() * 1e9));
			cracks = f.out;
			shards = f.sh;
			hit = { x, y };
			vb = `0 0 ${f.vw} ${f.vh}`;
			key++;
			playing = true;
			clearTimeout(timer);
			timer = setTimeout(() => (playing = false), 5200);
		};
		window.addEventListener('captain-shot', onShot);
		return () => {
			window.removeEventListener('captain-shot', onShot);
			clearTimeout(timer);
		};
	});
</script>

{#if playing}
	{#key key}
		<div class="impact" aria-hidden="true">
			<svg class="glass" viewBox={vb} preserveAspectRatio="none">
				<defs>
					<radialGradient id="sheen-mask" cx={hit.x} cy={hit.y} r="520" gradientUnits="userSpaceOnUse">
						<stop offset="0" stop-color="#fff" stop-opacity="1" />
						<stop offset="1" stop-color="#fff" stop-opacity="0" />
					</radialGradient>
					<mask id="sheen-area"><rect width="100%" height="100%" fill="url(#sheen-mask)" /></mask>
					<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0.35" stop-color="#cfe9ff" stop-opacity="0" />
						<stop offset="0.48" stop-color="#e8f4ff" stop-opacity="0.16" />
						<stop offset="0.52" stop-color="#ffffff" stop-opacity="0.05" />
						<stop offset="0.62" stop-color="#cfe9ff" stop-opacity="0" />
					</linearGradient>
				</defs>
				<!-- reflected light caught by the shattered pane, strongest near the hole -->
				<rect class="sheen" width="100%" height="100%" fill="url(#sheen)" mask="url(#sheen-area)" />
				<g class="cracks">
					{#each cracks as c}
						<path class="shadow" d={c.d} stroke-width={c.w + 1.2} style="--len:{c.len}; --delay:{c.delay}ms" />
						<path class="line" d={c.d} stroke-width={c.w} style="--len:{c.len}; --delay:{c.delay}ms" />
					{/each}
				</g>
				<circle class="hole-rim" cx={hit.x} cy={hit.y} r="9" />
				<circle class="hole" cx={hit.x} cy={hit.y} r="5.5" />
				<g class="shards">
					{#each shards as s}
						<polygon points={s.pts} style="--x:{s.x}px; --y:{s.y}px; --dx:{s.dx}px; --dy:{s.dy}px; --r:{s.r}deg; --delay:{s.delay}ms" />
					{/each}
				</g>
			</svg>
			<div class="flash" style="--x:{hit.x}px; --y:{hit.y}px"></div>
		</div>
	{/key}
{/if}

<style>
	.impact {
		position: fixed;
		inset: 0;
		z-index: 60;
		pointer-events: none;
		animation: hold-fade 5.2s ease forwards;
	}
	.glass {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.sheen {
		animation: sheen-in 0.5s ease-out both;
	}
	.cracks path {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: var(--len);
		stroke-dashoffset: var(--len);
		animation: crack 0.32s cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
		animation-delay: var(--delay);
	}
	.cracks .line {
		stroke: rgba(236, 246, 255, 0.85);
	}
	.cracks .shadow {
		stroke: rgba(4, 10, 20, 0.45);
		transform: translate(0.8px, 1px);
	}
	.hole {
		fill: rgba(4, 8, 14, 0.85);
	}
	.hole-rim {
		fill: rgba(220, 238, 255, 0.35);
		stroke: rgba(255, 255, 255, 0.7);
		stroke-width: 1;
	}
	.shards polygon {
		fill: rgba(205, 228, 250, 0.22);
		stroke: rgba(255, 255, 255, 0.65);
		stroke-width: 0.8;
		transform: translate(var(--x), var(--y));
		animation: shard 1.4s cubic-bezier(0.4, 0, 0.9, 0.6) forwards;
		animation-delay: var(--delay);
	}
	.flash {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: 240px;
		height: 240px;
		margin: -120px 0 0 -120px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 245, 220, 0.85), rgba(255, 200, 120, 0.25) 35%, transparent 70%);
		animation: flash 0.35s ease-out forwards;
	}
	@keyframes crack {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes shard {
		0% {
			transform: translate(var(--x), var(--y)) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translate(calc(var(--x) + var(--dx)), calc(var(--y) + var(--dy))) rotate(var(--r));
			opacity: 0;
		}
	}
	@keyframes flash {
		0% {
			opacity: 1;
			transform: scale(0.4);
		}
		100% {
			opacity: 0;
			transform: scale(1.3);
		}
	}
	@keyframes sheen-in {
		from {
			opacity: 0;
		}
	}
	@keyframes hold-fade {
		0%,
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.impact {
			display: none;
		}
	}
</style>
