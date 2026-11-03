<!--
  One fixed 3D canvas behind the whole page. Native scrolling drives a single
  story timeline (0 opening → 5 contact); nothing is pinned or hijacked.
  The page is fully usable before, during and without the scene: WebGL is
  progressive enhancement, signalled by `html.scene-live`.
-->
<script>
	import { onMount } from 'svelte';
	import { onFocus } from '$lib/scene/bus.js';
	import { projects } from '$lib/data/projects.js';
	import { ports } from '$lib/data/voyage.js';

	const STAGES = ['home', 'about', 'skills', 'projects', 'experience', 'contact'];

	/** 'static' | 'loading' | 'live' | 'unsupported' | 'failed' */
	let mode = $state('static');
	let paused = $state(false);
	let offerLoad = $state(false);
	let introRunning = $state(false);
	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {HTMLDivElement} */
	let hazeEl;
	/** @type {any} */
	let voyage = null;
	let pageVisible = true;
	let reduced = false;

	function hasWebGL() {
		try {
			const c = document.createElement('canvas');
			return !!(c.getContext('webgl2') || c.getContext('webgl'));
		} catch {
			return false;
		}
	}

	function sync() {
		if (!voyage) return;
		if (pageVisible && !paused) voyage.start();
		else voyage.stop();
	}

	/** Map the scroll position to the story timeline, holding on each stage. */
	function timeline() {
		const vh = window.innerHeight;
		const y = window.scrollY;
		const els = STAGES.map((id) => document.getElementById(id));
		if (els.some((e) => !e)) return { t: 0, projectsFrac: 0 };
		const anchors = els.map((e, i) => {
			if (i === 0) return 0;
			const el = /** @type {HTMLElement} */ (e);
			// a section can ask to be reached later, e.g. About waits until its stage window fills the screen
			const off = el.dataset.stageOffset ? Number(el.dataset.stageOffset) : 0.35;
			return el.offsetTop - vh * off;
		});
		let t = STAGES.length - 1;
		for (let i = 0; i < anchors.length - 1; i++) {
			if (y < anchors[i + 1]) {
				const len = Math.max(anchors[i + 1] - anchors[i], 1);
				const frac = Math.min(Math.max((y - anchors[i]) / len, 0), 1);
				// hold the shot, then travel during the last ~0.9 screens before the next section
				const w = Math.min(1, (0.9 * vh) / len);
				const x = Math.min(Math.max((frac - (1 - w)) / w, 0), 1);
				const eased = reduced ? (x > 0.5 ? 1 : 0) : x * x * (3 - 2 * x);
				t = i + eased;
				break;
			}
		}
		const p = /** @type {HTMLElement} */ (els[3]);
		const projectsFrac = Math.min(Math.max((y + vh * 0.6 - p.offsetTop) / p.offsetHeight, 0), 1);
		return { t, projectsFrac };
	}

	function update(instant = false) {
		if (!voyage) return;
		const { t, projectsFrac } = timeline();
		voyage.setTimeline(t, instant);
		voyage.setFocus({ projectsFrac });
		if (!voyage.running) voyage.renderStill();
	}

	async function load() {
		if (mode === 'loading' || mode === 'live') return;
		offerLoad = false;
		mode = 'loading';
		try {
			const { createVoyage } = await import('$lib/scene/voyage.js');
			const narrow = window.innerWidth < 760;
			// the fly-in plays on larger screens from the top of the page; phones start on the hero shot
			const playIntro = !reduced && !narrow && window.scrollY < 40;
			voyage = createVoyage(canvas, {
				quality: narrow ? 'low' : 'high',
				destinations: projects.map((p) => ({ title: p.title })),
				ports: ports.map((p) => ({ kind: p.kind })),
				intro: playIntro,
				onIntroEnd: () => (introRunning = false),
				onFrame: (/** @type {number} */ haze) => {
					if (hazeEl) hazeEl.style.opacity = String(Math.min(haze * 0.5, 0.5));
				},
				// screen position of the island rising on the chart: project cards grow out of it
				onPin: (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ on) => {
					const st = document.documentElement.style;
					st.setProperty('--pin-x', `${Math.round(x)}px`);
					st.setProperty('--pin-y', `${Math.round(y)}px`);
					st.setProperty('--pin-on', on.toFixed(3));
				}
			});
			canvas.addEventListener('webglcontextlost', (e) => {
				e.preventDefault();
				voyage?.stop();
				mode = 'failed';
				document.documentElement.classList.remove('scene-live');
			});
			update(true);
			voyage.renderStill();
			if (import.meta.env.DEV) /** @type {any} */ (window).__voyage = voyage; // dev-only test hook
			mode = 'live';
			document.documentElement.classList.add('scene-live');
			introRunning = playIntro;
			sync();
		} catch (err) {
			console.warn('3D scene unavailable, keeping the illustrated page.', err);
			voyage = null;
			mode = 'failed';
			document.documentElement.classList.remove('scene-live');
		}
	}

	function skipIntro() {
		voyage?.skipIntro();
		introRunning = false;
	}

	function togglePause() {
		paused = !paused;
		sync();
	}

	onMount(() => {
		const mq = matchMedia('(prefers-reduced-motion: reduce)');
		reduced = mq.matches;
		paused = reduced; // reduced motion: still frames that follow the scroll, animation on request

		if (!hasWebGL()) {
			mode = 'unsupported';
			return;
		}
		const conn = /** @type {any} */ (navigator).connection;
		if (window.innerWidth < 640 || conn?.saveData) {
			offerLoad = true; // phones / data saver: illustrated page, 3D on request
		} else {
			const idle = /** @type {any} */ (window).requestIdleCallback || ((/** @type {any} */ fn) => setTimeout(fn, 200));
			idle(() => load(), { timeout: 1500 });
		}

		const offFocus = onFocus((f) => voyage?.setFocus({ skill: f.skill, project: f.project, port: f.port }));

		const onVis = () => {
			pageVisible = document.visibilityState === 'visible';
			sync();
		};
		document.addEventListener('visibilitychange', onVis);

		let ticking = false;
		const onScroll = () => {
			if (introRunning && window.scrollY > 40) skipIntro();
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				ticking = false;
				update();
			});
		};
		window.addEventListener('scroll', onScroll, { passive: true });

		const fine = matchMedia('(pointer: fine)').matches;
		const onPointer = (/** @type {PointerEvent} */ e) => {
			if (!voyage || paused) return;
			voyage.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
		};
		if (fine) window.addEventListener('pointermove', onPointer, { passive: true });

		const onResize = () => {
			if (!voyage) return;
			voyage.resize();
			update(true);
		};
		window.addEventListener('resize', onResize);
		// sections change height as fonts/images load; keep the anchors fresh
		const ro = new ResizeObserver(() => update());
		ro.observe(document.body);

		const onMq = () => {
			reduced = mq.matches;
			if (reduced) {
				paused = true;
				skipIntro();
				sync();
			}
		};
		mq.addEventListener('change', onMq);

		return () => {
			offFocus();
			ro.disconnect();
			document.removeEventListener('visibilitychange', onVis);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('pointermove', onPointer);
			window.removeEventListener('resize', onResize);
			mq.removeEventListener('change', onMq);
			voyage?.dispose();
			voyage = null;
			document.documentElement.classList.remove('scene-live');
		};
	});
</script>

<div class="stage" aria-hidden="true">
	<canvas bind:this={canvas} class:on={mode === 'live'}></canvas>
	<div class="haze" bind:this={hazeEl}></div>
</div>

<div class="scene-controls" role="group" aria-label="3D scene">
	{#if introRunning}
		<button class="ctrl" type="button" onclick={skipIntro}>Skip intro</button>
	{/if}
	{#if mode === 'live'}
		<button class="ctrl toggle" type="button" onclick={togglePause} aria-pressed={paused} aria-label={paused ? 'Animate the 3D scene' : 'Pause the 3D scene'}>
			<span class="dot" class:still={paused} aria-hidden="true"></span>
			<span class="label" aria-hidden="true">{paused ? 'Animate scene' : 'Pause scene'}</span>
		</button>
	{:else if mode === 'loading'}
		<span class="ctrl status" role="status">Rigging the 3D voyage…</span>
	{:else if mode === 'failed'}
		<span class="ctrl status" role="status">3D scene unavailable, showing the illustrated version</span>
	{:else if offerLoad}
		<button class="ctrl load" type="button" onclick={load} aria-label="Load 3D voyage">
			<span class="long" aria-hidden="true">Load 3D voyage</span><span class="short" aria-hidden="true">3D</span>
		</button>
	{/if}
</div>

<style>
	.stage {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		opacity: 0;
		transition: opacity 1.4s var(--ease-out);
	}
	canvas.on {
		opacity: 1;
	}
	.haze {
		position: absolute;
		inset: 0;
		background: radial-gradient(120% 90% at 60% 50%, #2a3a52 0%, #0d1a2e 70%);
		opacity: 0;
		will-change: opacity;
	}
	.scene-controls {
		position: fixed;
		right: 16px;
		bottom: 16px;
		z-index: 80;
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.ctrl {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 40px;
		padding: 6px 14px;
		border-radius: 999px;
		border: 1px solid var(--line-strong);
		background: rgba(6, 11, 21, 0.78);
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
	/* phones: tuck the controls into the header bar, beside the menu button */
	@media (max-width: 759px) {
		.scene-controls {
			top: 12px;
			bottom: auto;
			right: 128px;
			z-index: 110;
		}
		.ctrl {
			min-height: 40px;
		}
		.toggle {
			width: 40px;
			padding: 0;
			justify-content: center;
		}
		.toggle .label {
			display: none;
		}
		.status {
			display: none;
		}
		.load .long {
			display: none;
		}
		.load .short {
			display: inline;
		}
	}
	.load .short {
		display: none;
	}
	@media print {
		.stage,
		.scene-controls {
			display: none;
		}
	}
</style>
