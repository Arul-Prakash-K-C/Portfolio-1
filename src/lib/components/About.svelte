<script>
	import { about, education, experience } from '$lib/data/profile.js';
	import { reveal } from '$lib/actions.js';
	import AboutScene from './AboutScene.svelte';

	// One logbook: current role first, then education.
	const log = [
		...experience.map((e) => ({ kind: 'Crew', title: e.title, org: e.org, period: e.period, note: '' })),
		...education.map((e) => ({ kind: 'Study', ...e }))
	];
</script>

<section id="about" class="section about" aria-labelledby="about-title">
	<AboutScene />
	<div class="container cols">
		<div class="intro">
			<header class="section-head reveal" use:reveal>
				<p class="eyebrow">Log 02 · The captain &amp; the builder</p>
				<h2 id="about-title" class="section-title">About</h2>
			</header>
			{#each about as para, i}
				<p class="para reveal" use:reveal style="--d:{i * 80}ms">{para}</p>
			{/each}
		</div>

		<div class="book reveal" use:reveal style="--d:120ms">
			<h3 class="book-title">Logbook</h3>
			<ol class="timeline">
				{#each log as item, i}
					<li style="--unroll-order:{i}">
						<span class="kind">{item.kind}</span>
						<p class="period">{item.period}</p>
						<h4>{item.title}</h4>
						<p class="org">{item.org}</p>
						{#if item.note}<p class="note">{item.note}</p>{/if}
					</li>
				{/each}
			</ol>
		</div>
	</div>
</section>

<style>
	.about {
		position: relative;
		isolation: isolate;
		background: var(--navy);
		border-top: 1px solid var(--line);
		min-height: 100svh;
	}
	.cols {
		position: relative;
		z-index: 2;
		display: block;
	}
	.intro { max-width: min(57%, 650px); }
	.para {
		color: var(--parchment-2);
		font-size: 1.1rem;
		max-width: 60ch;
	}
	.para + .para {
		margin-top: 18px;
	}
	.book {
		position: relative;
		z-index: 2;
		max-width: min(57%, 650px);
		margin-top: clamp(42px, 6vw, 76px);
		padding: clamp(30px, 3.5vw, 42px) clamp(26px, 3vw, 36px);
		border-radius: 12px;
		background:
			linear-gradient(90deg, rgba(107, 73, 35, .16), transparent 5%, transparent 94%, rgba(107, 73, 35, .14)),
			repeating-linear-gradient(0deg, rgba(103, 71, 36, .028) 0 1px, transparent 1px 6px),
			linear-gradient(160deg, #f1e5c8, #d8c59b);
		color: #2b2114;
		box-shadow: 0 34px 80px rgba(0, 0, 0, 0.42), inset 0 0 34px rgba(100, 66, 29, .14);
	}
	.book::before {
		content: '';
		position: absolute;
		left: -8px;
		right: -8px;
		top: -11px;
		height: 18px;
		border-radius: 50%;
		background: linear-gradient(180deg, #ddc89c, #8a6637 48%, #c3a875 70%, #ead8b1);
		box-shadow: 0 3px 8px rgba(0, 0, 0, .28);
		pointer-events: none;
	}
	.book::after {
		content: '';
		position: absolute;
		left: -8px;
		right: -8px;
		bottom: -11px;
		height: 18px;
		border-radius: 50%;
		background: linear-gradient(180deg, #ead8b1, #c3a875 30%, #8a6637 58%, #ddc89c);
		box-shadow: 0 5px 9px rgba(0, 0, 0, .24);
		pointer-events: none;
	}
	.book-title {
		font-size: 1.3rem;
		color: #4a3214;
		margin-bottom: 18px;
	}
	.timeline {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 22px;
		border-left: 2px dashed rgba(122, 85, 32, 0.45);
		padding-left: 22px;
	}
	.timeline li {
		position: relative;
		transform-origin: top left;
	}
	:global(.book.is-in .timeline li) { animation: unroll-entry 720ms cubic-bezier(.2,.8,.22,1) both; animation-delay: calc(var(--unroll-order) * 140ms); }
	@keyframes unroll-entry { from { opacity: .15; clip-path: inset(0 0 82%); transform: translateY(-10px) scaleY(.72); } to { opacity: 1; clip-path: inset(0); transform: translateY(0) scaleY(1); } }
	.timeline li::before {
		content: '';
		position: absolute;
		left: -30px;
		top: 6px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #7a5520;
		box-shadow: 0 0 0 4px #e6d8b6;
	}
	.kind {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #0d5e57;
		font-weight: 700;
	}
	.period {
		font-family: var(--font-mono);
		font-size: 0.82rem;
		color: #5a4424;
	}
	h4 {
		font-size: 1.08rem;
		color: #2b2114;
		margin-top: 2px;
	}
	.org {
		color: #3d2e18;
	}
	.note {
		font-size: 0.9rem;
		color: #4d3a1e;
		margin-top: 4px;
	}
	@media (max-width: 860px) {
		.intro, .book { max-width: 100%; }
	}
	@media (prefers-reduced-motion: reduce) { :global(.book.is-in .timeline li) { animation: none; } }
</style>
