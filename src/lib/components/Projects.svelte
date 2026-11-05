<script>
	import { projects, logEntries } from '$lib/data/projects.js';
	import { reveal } from '$lib/actions.js';
	import RouteMap from './RouteMap.svelte';
	import CaseStudy from './CaseStudy.svelte';
	import { setFocus } from '$lib/scene/bus.js';
	import { onMount } from 'svelte';

	/** @type {HTMLOListElement} */
	let list;
	/** @type {HTMLDivElement} */
	let tether;
	let active = $state(-1);
	let pendingPop = -1;
	let revealed = $state(-1);

	/** Grow the newly active card out of the island that just rose on the 3D chart. */
	function popFrom(/** @type {Element} */ card) {
		const root = document.documentElement;
		if (!root.classList.contains('scene-live') || window.innerWidth < 760) return;
		const cs = getComputedStyle(root);
		const px = parseFloat(cs.getPropertyValue('--pin-x'));
		const py = parseFloat(cs.getPropertyValue('--pin-y'));
		if (!Number.isFinite(px) || !Number.isFinite(py)) return;
		const r = card.getBoundingClientRect();
		const el = /** @type {HTMLElement} */ (card);
		el.style.setProperty('--ox', `${px - r.left}px`);
		el.style.setProperty('--oy', `${py - r.top}px`);
		el.classList.remove('pop');
		void el.offsetWidth; // restart the animation
		el.classList.add('pop');
	}

	// a thin line from the island on the chart to the active card
	function drawTether() {
		if (!tether) return;
		const root = document.documentElement;
		const card = active >= 0 ? list?.children[active]?.firstElementChild : null;
		const cs = getComputedStyle(root);
		const on = parseFloat(cs.getPropertyValue('--pin-on')) || 0;
		if (!card || !root.classList.contains('scene-live') || window.innerWidth < 760 || on < 0.05) {
			tether.style.opacity = '0';
			return;
		}
		const px = parseFloat(cs.getPropertyValue('--pin-x'));
		const py = parseFloat(cs.getPropertyValue('--pin-y'));
		const r = card.getBoundingClientRect();
		const tx = r.left,
			ty = Math.min(Math.max(py, r.top + 40), r.bottom - 40);
		const len = Math.hypot(tx - px, ty - py);
		tether.style.opacity = String(Math.min(1, on) * 0.9);
		tether.style.width = `${len}px`;
		tether.style.transform = `translate(${px}px, ${py}px) rotate(${Math.atan2(ty - py, tx - px)}rad)`;
	}

	// highlight the matching island on the 3D chart for the card nearest the middle of the screen
	onMount(() => {
		let raf = 0;
		const loop = () => {
			raf = requestAnimationFrame(loop);
			drawTether();
			if (pendingPop >= 0) {
				const root = document.documentElement;
				const on = parseFloat(getComputedStyle(root).getPropertyValue('--pin-on')) || 0;
				// no 3D chart (or a phone): show the card straight away
				const no3d = !root.classList.contains('scene-live') || window.innerWidth < 760;
				if (no3d || on > 0.5) {
					const card = list.children[pendingPop]?.firstElementChild;
					if (card && !no3d) popFrom(card);
					revealed = Math.max(revealed, pendingPop);
					pendingPop = -1;
				}
			}
		};
		raf = requestAnimationFrame(loop);
		const cards = Array.from(list.querySelectorAll(':scope > li'));
		const seen = new Map();
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) seen.set(e.target, e.isIntersecting ? e.intersectionRect.height : 0);
				let best = -1,
					bestH = 0;
				cards.forEach((c, i) => {
					const h = seen.get(c) ?? 0;
					if (h > bestH) {
						best = i;
						bestH = h;
					}
				});
				if (best !== active) {
					active = best;
					pendingPop = best; // the card rises once the route has inked its way to the mark
				}
				setFocus({ project: best });
			},
			{ rootMargin: '-42% 0px -42% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
		);
		cards.forEach((c) => io.observe(c));
		return () => {
			io.disconnect();
			cancelAnimationFrame(raf);
		};
	});

	/** @type {any} */
	let selected = $state(null);
	/** @type {HTMLElement | null} */
	let returnFocus = null;

	/** @param {any} p @param {MouseEvent} e */
	function open(p, e) {
		returnFocus = /** @type {HTMLElement} */ (e.currentTarget);
		selected = p;
	}
	function closed() {
		selected = null;
		returnFocus?.focus();
	}
</script>

<section id="projects" class="section projects" aria-labelledby="projects-title">
	<div class="container">
		<header class="section-head reveal" use:reveal>
			<p class="eyebrow">Log 03 · Map destinations</p>
			<h2 id="projects-title" class="section-title">Projects</h2>
			<p class="section-lede">
				Full-stack apps built and shipped in 2026, each one a destination on the chart. Open any entry for the
				mission file: the goal, users, Arul’s role, features, architecture and where each detail comes from.
			</p>
		</header>

		<ol class="grid" bind:this={list}>
			{#each projects as p, i}
				<li class="step" class:active={active === i && revealed >= i} class:ahead={i > revealed}>
				<article class="card reveal" use:reveal style="--d:{(i % 2) * 90}ms" aria-labelledby="proj-{p.id}">
					<div class="cover">
						{#if p.shots.length}
							<img src={p.shots[0].src} alt={p.shots[0].alt} loading="lazy" decoding="async" width="1199" height="674" />
						{:else}
							<RouteMap groups={p.routeMap} title={p.title} compact />
						{/if}
						<span class="no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
					</div>
					<div class="meta">
						<p class="status">
							<span class="pip" class:live={!!p.live} aria-hidden="true"></span>{p.status} · {p.year}
						</p>
						<h3 id="proj-{p.id}">{p.title}</h3>
						<p class="kicker">{p.kicker}</p>
						<p class="summary">{p.summary}</p>
						<p class="team">{p.team}</p>
						<ul class="chips" aria-label="Technologies">
							{#each p.stack.slice(0, 5) as s}<li class="chip">{s}</li>{/each}
							{#if p.stack.length > 5}<li class="chip">+{p.stack.length - 5}</li>{/if}
						</ul>
						<div class="actions">
							<button class="btn btn-primary btn-sm" type="button" onclick={(e) => open(p, e)}>
								Read case study<span class="sr-only">: {p.title}</span>
							</button>
							{#if p.live}
								<a class="btn btn-sm" href={p.live} target="_blank" rel="noopener">
									Live project ↗<span class="sr-only">: {p.title} (opens in a new tab)</span>
								</a>
							{/if}
							{#if p.source}
								<a class="btn btn-sm btn-ghost" href={p.source} target="_blank" rel="noopener">
									Source ↗<span class="sr-only">: {p.title} on GitHub (opens in a new tab)</span>
								</a>
							{/if}
						</div>
					</div>
				</article>
				</li>
			{/each}
		</ol>

		<div class="log reveal" use:reveal>
			<h3 class="log-title">Earlier entries in the log</h3>
			<p class="log-lede">Smaller builds from 2024–2026, kept in Arul’s public repositories.</p>
			<ul class="entries">
				{#each logEntries as e}
					<li class="entry">
						<div class="entry-head">
							<h4>{e.title}</h4>
							<span class="yr">{e.year}</span>
						</div>
						<p>{e.summary}</p>
						<ul class="chips">
							{#each e.stack as s}<li class="chip">{s}</li>{/each}
						</ul>
						<p class="entry-links">
							{#each e.links as l, i}
								{#if i > 0}<span aria-hidden="true"> · </span>{/if}
								<a href={l.href} target="_blank" rel="noopener">{l.label}<span class="sr-only"> for {e.title} (GitHub, opens in a new tab)</span> ↗</a>
							{/each}
						</p>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<div class="tether" bind:this={tether} aria-hidden="true"></div>

<CaseStudy project={selected} onclose={closed} />

<style>
	:global(html.scene-live) .projects::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(90deg, rgba(5, 10, 20, 0.55) 0%, rgba(5, 10, 20, 0.2) 60%), linear-gradient(180deg, rgba(5, 10, 20, 0.45) 0%, rgba(5, 10, 20, 0.66) 30%, rgba(5, 10, 20, 0.66) 85%, rgba(5, 10, 20, 0.3) 100%);
	}
	.projects .container {
		position: relative;
	}
	:global(html.scene-live) .projects .section-head {
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.8);
	}
	:global(html.scene-live) .projects .log {
		background: rgba(6, 12, 22, 0.86);
	}
	.projects {
		background:
			radial-gradient(80% 60% at 85% 0%, rgba(90, 214, 201, 0.06), transparent 60%),
			linear-gradient(180deg, var(--ink), var(--navy) 30%, var(--navy));
	}
	.step {
		display: flex;
	}
	.step > .card {
		flex: 1;
	}
	.grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(18px, 3vw, 30px);
	}
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		border-radius: 18px;
		border: 1px solid var(--line);
		background: linear-gradient(180deg, rgba(20, 30, 50, 0.85), rgba(12, 20, 36, 0.9));
		overflow: hidden;
		transition:
			transform var(--t-med) var(--ease-out),
			border-color var(--t-med),
			box-shadow var(--t-med);
	}
	.card:hover,
	.card:focus-within {
		transform: translateY(-4px);
		border-color: rgba(217, 168, 78, 0.5);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
	}
	.cover {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #fff;
		border-bottom: 1px solid var(--line);
	}
	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
		transition: transform 1.2s var(--ease-out);
	}
	.card:hover .cover img,
	.card:focus-within .cover img {
		transform: scale(1.04);
	}
	.no {
		position: absolute;
		left: 12px;
		bottom: 10px;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.85rem;
		padding: 2px 10px;
		border-radius: 999px;
		background: rgba(6, 11, 21, 0.85);
		color: var(--brass-2);
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 22px 22px 24px;
		flex: 1;
	}
	.status {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.pip {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--muted);
	}
	.pip.live {
		background: var(--teal);
		box-shadow: 0 0 10px var(--teal);
	}
	h3 {
		font-size: 1.55rem;
	}
	.kicker {
		color: var(--brass-2);
		font-weight: 500;
		margin-top: -4px;
	}
	.summary {
		color: var(--parchment-2);
	}
	.team {
		font-size: 0.86rem;
		color: var(--muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: auto;
		padding-top: 8px;
	}

	.log {
		margin-top: clamp(56px, 8vw, 90px);
		padding: clamp(22px, 4vw, 36px);
		border-radius: 18px;
		border: 1px solid var(--line);
		background:
			linear-gradient(180deg, rgba(239, 228, 204, 0.04), rgba(239, 228, 204, 0.015));
	}
	.log-title {
		font-size: 1.5rem;
	}
	.log-lede {
		color: var(--muted);
		margin: 6px 0 22px;
	}
	.entries {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 14px;
	}
	.entry {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: rgba(6, 11, 21, 0.35);
	}
	.entry-head {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: baseline;
	}
	h4 {
		font-size: 1.02rem;
		color: var(--parchment);
	}
	.yr {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--teal);
		white-space: nowrap;
	}
	.entry p {
		font-size: 0.92rem;
		color: var(--parchment-2);
	}
	.entry-links {
		margin-top: auto;
	}
	.entry-links a {
		font-size: 0.88rem;
	}

	/* ---------- 3D voyage on: the chart sits on the left, projects arrive one at a time ---------- */
	.tether {
		position: fixed;
		left: 0;
		top: 0;
		height: 1px;
		transform-origin: 0 50%;
		background: linear-gradient(90deg, rgba(90, 214, 201, 0.95), rgba(243, 196, 107, 0.6));
		box-shadow: 0 0 10px rgba(90, 214, 201, 0.7);
		opacity: 0;
		pointer-events: none;
		z-index: 2;
		transition: opacity 0.4s;
	}
	@media (min-width: 760px) {
		:global(html.scene-live) .projects::before {
			background:
				linear-gradient(270deg, rgba(5, 10, 20, 0.6) 0%, rgba(5, 10, 20, 0.25) 42%, rgba(5, 10, 20, 0) 60%),
				linear-gradient(180deg, rgba(5, 10, 20, 0.5) 0%, rgba(5, 10, 20, 0.1) 22%, rgba(5, 10, 20, 0.1) 88%, rgba(5, 10, 20, 0.45) 100%);
		}
		:global(html.scene-live) .projects .grid {
			grid-template-columns: 1fr;
			width: min(540px, 44%);
			margin-left: auto;
			gap: 0;
		}
		:global(html.scene-live) .projects .grid > .step {
			min-height: 92svh;
			align-items: center;
		}
		:global(html.scene-live) .projects .grid > .step > .card {
			opacity: 0.12;
			transform: scale(0.94);
			filter: saturate(0.4);
			transition:
				opacity 0.6s var(--ease-out),
				transform 0.6s var(--ease-out),
				filter 0.6s,
				border-color var(--t-med),
				box-shadow var(--t-med);
		}
		/* not reached yet: nothing shown in advance (a keyboard user tabbing in still gets it) */
		:global(html.scene-live) .projects .grid > .step.ahead > .card {
			opacity: 0;
		}
		:global(html.scene-live) .projects .grid > .step:focus-within > .card {
			opacity: 1;
			transform: none;
			filter: none;
		}
		:global(html.scene-live) .projects .grid > .step.active > .card {
			opacity: 1;
			transform: none;
			filter: none;
			border-color: rgba(90, 214, 201, 0.45);
			box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(90, 214, 201, 0.15);
		}
		:global(html.scene-live) .projects .grid > .step.active > .card:global(.pop) {
			animation: pop-from-isle 0.75s var(--ease-out) both;
			transform-origin: var(--ox, 0) var(--oy, 50%);
		}
	}
	@keyframes pop-from-isle {
		0% {
			opacity: 0;
			transform: scale(0.06);
			filter: blur(6px) brightness(1.6);
		}
		60% {
			opacity: 1;
			filter: blur(0) brightness(1.15);
		}
		100% {
			opacity: 1;
			transform: none;
			filter: none;
		}
	}
	@media (max-width: 759px) {
		/* phones: the chart fills the top of the screen, each project slides up beneath it */
		:global(html.scene-live) .projects .grid > .step {
			padding-top: 46svh;
		}
		:global(html.scene-live) .projects .grid > .step:first-child {
			padding-top: 30svh;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(html.scene-live) .projects .grid > .step.active > .card:global(.pop) {
			animation: none;
		}
	}

	@media (max-width: 980px) {
		.entries {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 760px) {
		.grid,
		.entries {
			grid-template-columns: 1fr;
		}
	}
</style>
