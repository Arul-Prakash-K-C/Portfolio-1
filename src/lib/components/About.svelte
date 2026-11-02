<script>
	import { about, education, experience } from '$lib/data/profile.js';
	import { reveal } from '$lib/actions.js';

	// One logbook: current role first, then education.
	const log = [
		...experience.map((e) => ({ kind: 'Crew', title: e.title, org: e.org, period: e.period, note: '' })),
		...education.map((e) => ({ kind: 'Study', ...e }))
	];
</script>

<section id="about" class="section about" aria-labelledby="about-title">
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
				{#each log as item}
					<li>
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
		background: var(--navy);
		border-top: 1px solid var(--line);
	}
	.cols {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: clamp(32px, 6vw, 80px);
		align-items: start;
	}
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
		padding: clamp(22px, 3vw, 32px);
		border-radius: 18px;
		background: linear-gradient(160deg, #efe4cc, #dccca6);
		color: #2b2114;
		box-shadow: 0 30px 70px rgba(0, 0, 0, 0.35);
	}
	.book::before {
		content: '';
		position: absolute;
		inset: 10px;
		border: 1px solid rgba(90, 60, 25, 0.3);
		border-radius: 12px;
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
	}
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
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
