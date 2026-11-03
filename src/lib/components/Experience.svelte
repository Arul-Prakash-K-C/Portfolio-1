<script>
	import { certifications } from '$lib/data/profile.js';
	import { ports } from '$lib/data/voyage.js';
	import { reveal } from '$lib/actions.js';
	import { setFocus } from '$lib/scene/bus.js';
	import { onMount } from 'svelte';

	/** @type {HTMLOListElement} */
	let list;
	let active = $state(-1);

	onMount(() => {
		const steps = Array.from(list.querySelectorAll(':scope > li'));
		const seen = new Map();
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) seen.set(e.target, e.isIntersecting ? e.intersectionRect.height : 0);
				let best = -1,
					bestH = 0;
				steps.forEach((c, i) => {
					const h = seen.get(c) ?? 0;
					if (h > bestH) {
						best = i;
						bestH = h;
					}
				});
				if (best >= 0) active = best;
				setFocus({ port: best >= 0 ? best : active });
			},
			{ rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.5, 1] }
		);
		steps.forEach((c) => io.observe(c));
		return () => io.disconnect();
	});
</script>

<section id="experience" class="section stage-section experience" aria-labelledby="exp-title">
	<div class="container voyage">
		<header class="head reveal" use:reveal>
			<p class="kicker">Log 04 · The ship’s log</p>
			<h2 id="exp-title">Experience &amp; education</h2>
			<p class="lede">The same ship, port by port: where Arul studied, the course projects built along the way, and the crew Arul sails with now.</p>
		</header>

		<ol class="ports" bind:this={list}>
			{#each ports as p, i}
				<li class="step" class:active={active === i}>
					<article class="port reveal" use:reveal>
						<p class="leg"><span class="no">{String(i + 1).padStart(2, '0')}</span>{p.kind}</p>
						<p class="period">{p.period}</p>
						<h3>{p.title}</h3>
						<p class="org">{p.org}</p>
						{#if p.points.length}
							<ul class="points">
								{#each p.points as pt}<li>{pt}</li>{/each}
							</ul>
						{/if}
					</article>
				</li>
			{/each}
		</ol>

		{#if certifications.length}
			<section class="certs" aria-labelledby="log-certs">
				<h3 id="log-certs">Certifications</h3>
				<ol class="entries">
					{#each certifications as c}
						<li>
							<p class="period">{c.date}</p>
							<h4>{c.name}</h4>
							<p class="org">{c.issuer}</p>
							{#if c.url}<a href={c.url} target="_blank" rel="noopener">View credential ↗<span class="sr-only"> (opens in a new tab)</span></a>{/if}
						</li>
					{/each}
				</ol>
			</section>
		{/if}
	</div>
</section>

<style>
	.experience {
		background: #06121a;
		border-top: 1px solid rgba(90, 214, 201, 0.12);
	}
	.voyage {
		display: grid;
		gap: 24px;
	}
	.head {
		max-width: 560px;
	}
	.kicker {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--teal);
		font-weight: 700;
	}
	h2 {
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		margin-top: 6px;
	}
	.lede {
		color: var(--parchment-2);
		margin-top: 10px;
	}
	.ports {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 16px;
	}
	.step {
		display: flex;
	}
	.port {
		flex: 1;
		position: relative;
		padding: 22px 24px;
		border-radius: 16px;
		background: linear-gradient(160deg, #f1e6cd, #dccca6);
		color: #2b2114;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
	}
	.port::before {
		content: '';
		position: absolute;
		inset: 8px;
		border: 1px solid rgba(90, 60, 25, 0.3);
		border-radius: 10px;
		pointer-events: none;
	}
	.leg {
		display: flex;
		align-items: center;
		gap: 10px;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #0d5e57;
		font-weight: 700;
	}
	.no {
		font-family: var(--font-display);
		font-size: 0.8rem;
		letter-spacing: 0;
		padding: 1px 9px;
		border-radius: 999px;
		background: #2b2114;
		color: #f3c46b;
	}
	.period {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: #5a4424;
		margin-top: 12px;
	}
	h3 {
		font-size: 1.3rem;
		color: #2b2114;
		margin-top: 2px;
	}
	.org {
		color: #3d2e18;
	}
	.points {
		margin-top: 8px;
		padding-left: 18px;
		color: #3d2e18;
	}
	.certs h3 {
		color: var(--parchment);
	}
	.entries {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 12px;
	}
	h4 {
		font-size: 1.05rem;
	}
	a {
		color: var(--teal);
	}

	/* ---------- 3D voyage on: one port at a time, the ship sails past each ---------- */
	:global(html.scene-live) .experience {
		display: block;
	}
	:global(html.scene-live) .experience .ports {
		grid-template-columns: 1fr;
		width: min(440px, 100%);
		gap: 0;
	}
	:global(html.scene-live) .experience .step {
		min-height: 88svh;
		align-items: center;
	}
	:global(html.scene-live) .experience .step > .port {
		opacity: 0.1;
		transform: translateX(-28px) scale(0.96);
		transition:
			opacity 0.7s var(--ease-out),
			transform 0.7s var(--ease-out);
	}
	:global(html.scene-live) .experience .step.active > .port {
		opacity: 1;
		transform: none;
		animation: port-in 0.8s var(--ease-out);
	}
	:global(html.scene-live) .experience .head {
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.8);
	}
	@keyframes port-in {
		0% {
			opacity: 0;
			transform: translateX(-40px) scale(0.92);
			filter: blur(4px);
		}
		100% {
			opacity: 1;
			transform: none;
			filter: none;
		}
	}
	@media (max-width: 759px) {
		:global(html.scene-live) .experience {
			padding-top: 0;
		}
		:global(html.scene-live) .experience .step {
			min-height: 100svh;
			padding-bottom: 4svh;
			align-items: flex-end;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(html.scene-live) .experience .step.active > .port {
			animation: none;
		}
	}
</style>
