<script>
	import { onMount } from 'svelte';
	import HeroFallback from './HeroFallback.svelte';

	/** @type {{ heroEl?: HTMLElement }} */
	let { heroEl } = $props();

	/** 'static' → fallback art only; 'loading'; 'live'; 'unsupported'; 'failed' */
	let mode = $state('static');
	let paused = $state(false);
	let reduced = $state(false);
	let offerLoad = $state(false);
	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {HTMLDivElement} */
	let host;
	/** @type {any} */
	let voyage = null;
	let visible = true;
	let pageVisible = true;

	function hasWebGL() {
		try {
			const c = document.createElement('canvas');
			return !!(c.getContext('webgl2') || c.getContext('webgl'));
		} catch {
			return false;
		}
	}

	function shouldRun() {
		return !!voyage && visible && pageVisible && !paused;
	}

	function sync() {
		if (!voyage) return;
		if (shouldRun()) voyage.start();
		else voyage.stop();
	}

	async function load() {
		if (mode === 'loading' || mode === 'live') return;
		offerLoad = false;
		mode = 'loading';
		try {
			const { createVoyage } = await import('$lib/scene/voyage.js');
			const narrow = window.innerWidth < 760;
			voyage = createVoyage(canvas, { quality: narrow ? 'low' : 'high' });
			canvas.addEventListener('webglcontextlost', (e) => {
				e.preventDefault();
				voyage?.stop();
				mode = 'failed';
			});
			updateScroll();
			voyage.renderStill();
			mode = 'live';
			sync();
		} catch (err) {
			console.warn('3D scene unavailable, keeping the illustrated fallback.', err);
			voyage = null;
			mode = 'failed';
		}
	}

	function togglePause() {
		paused = !paused;
		sync();
	}

	function updateScroll() {
		if (!voyage || !heroEl) return;
		const h = heroEl.offsetHeight || window.innerHeight;
		const p = Math.min(Math.max(window.scrollY / h, 0), 1);
		voyage.setScroll(p);
		if (!voyage.running && mode === 'live') voyage.renderStill();
	}

	onMount(() => {
		const mq = matchMedia('(prefers-reduced-motion: reduce)');
		reduced = mq.matches;
		paused = reduced; // reduced motion: a still frame, animation only on request

		if (!hasWebGL()) {
			mode = 'unsupported';
			return;
		}

		const conn = /** @type {any} */ (navigator).connection;
		const saveData = !!conn?.saveData;
		const small = window.innerWidth < 640;

		if (small || saveData) {
			offerLoad = true; // phones / data saver: illustrated scene, 3D on request
		} else {
			// load after first paint so the hero text is never blocked
			const idle = /** @type {any} */ (window).requestIdleCallback || ((/** @type {any} */ fn) => setTimeout(fn, 200));
			idle(() => load(), { timeout: 1500 });
		}

		const io = new IntersectionObserver(
			([e]) => {
				visible = e.isIntersecting;
				sync();
			},
			{ threshold: 0.01 }
		);
		io.observe(host);

		const onVis = () => {
			pageVisible = document.visibilityState === 'visible';
			sync();
		};
		document.addEventListener('visibilitychange', onVis);

		let ticking = false;
		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				ticking = false;
				updateScroll();
			});
		};
		window.addEventListener('scroll', onScroll, { passive: true });

		const fine = matchMedia('(pointer: fine)').matches;
		const onPointer = (/** @type {PointerEvent} */ e) => {
			if (!voyage || paused) return;
			voyage.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
		};
		if (fine) window.addEventListener('pointermove', onPointer, { passive: true });

		const ro = new ResizeObserver(() => {
			if (!voyage) return;
			voyage.resize();
			if (!voyage.running) voyage.renderStill();
		});
		ro.observe(host);

		const onMq = () => {
			reduced = mq.matches;
			if (reduced) {
				paused = true;
				sync();
			}
		};
		mq.addEventListener('change', onMq);

		return () => {
			io.disconnect();
			ro.disconnect();
			document.removeEventListener('visibilitychange', onVis);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('pointermove', onPointer);
			mq.removeEventListener('change', onMq);
			voyage?.dispose();
			voyage = null;
		};
	});
</script>

<div class="scene" bind:this={host} data-mode={mode}>
	<HeroFallback />
	<canvas bind:this={canvas} class:on={mode === 'live'} aria-hidden="true"></canvas>
	<div class="veil" aria-hidden="true"></div>
</div>

<div class="scene-controls">
	{#if mode === 'live'}
		<button class="ctrl" type="button" onclick={togglePause} aria-pressed={paused}>
			<span class="dot" class:still={paused} aria-hidden="true"></span>
			{paused ? 'Animate scene' : 'Pause scene'}
		</button>
	{:else if mode === 'loading'}
		<span class="ctrl status" role="status">Rigging the 3D scene…</span>
	{:else if offerLoad}
		<button class="ctrl" type="button" onclick={load}>Load 3D scene</button>
	{/if}
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: #050a14;
	}
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		opacity: 0;
		transition: opacity 1.2s var(--ease-out);
	}
	canvas.on {
		opacity: 1;
	}
	/* readability veil: darkens the left side where the text sits, and the bottom edge */
	.veil {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(90deg, rgba(6, 11, 21, 0.82) 0%, rgba(6, 11, 21, 0.45) 42%, rgba(6, 11, 21, 0) 68%),
			linear-gradient(180deg, rgba(6, 11, 21, 0) 60%, var(--ink) 100%);
		pointer-events: none;
	}
	@media (max-width: 860px) {
		.veil {
			background:
				linear-gradient(180deg, rgba(6, 11, 21, 0.35) 0%, rgba(6, 11, 21, 0.8) 55%, var(--ink) 100%);
		}
	}
	.scene-controls {
		position: absolute;
		right: var(--gutter);
		bottom: 28px;
		z-index: 3;
	}
	.ctrl {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 36px;
		padding: 6px 14px;
		border-radius: 999px;
		border: 1px solid var(--line-strong);
		background: rgba(6, 11, 21, 0.6);
		color: var(--parchment-2);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		cursor: pointer;
		backdrop-filter: blur(6px);
	}
	.ctrl:hover {
		border-color: var(--teal);
		color: var(--parchment);
	}
	.status {
		cursor: default;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--teal);
		box-shadow: 0 0 10px var(--teal);
	}
	.dot.still {
		background: var(--muted);
		box-shadow: none;
	}
</style>
