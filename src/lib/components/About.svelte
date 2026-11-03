<script>
	import { about, education, experience } from '$lib/data/profile.js';
	import { reveal } from '$lib/actions.js';

	const current = experience[0];
</script>

<section id="about" class="section stage-section about" aria-labelledby="about-title">
	<div class="container split">
		<div class="panel reveal" use:reveal>
			<header class="section-head">
				<p class="eyebrow">Log 01 · The captain at the wheel</p>
				<h2 id="about-title" class="section-title">About</h2>
			</header>
			{#each about as para}
				<p class="para">{para}</p>
			{/each}

			<dl class="facts">
				<div class="fact">
					<dt>Now</dt>
					<dd>
						<strong>{current.title}</strong>
						<span>{current.org} · {current.period}</span>
					</dd>
				</div>
				{#each education as e}
					<div class="fact">
						<dt>Education</dt>
						<dd>
							<strong>{e.title}</strong>
							<span>{e.org} · {e.period}</span>
						</dd>
					</div>
				{/each}
			</dl>
		</div>

		<!-- 2D stand-in for the 3D captain and wheel when the scene is off -->
		<figure class="art-fallback" aria-hidden="true">
			<svg viewBox="0 0 200 200" width="260" height="260">
				<g fill="none" stroke="#d9a84e" stroke-width="4" stroke-linecap="round">
					<circle cx="100" cy="100" r="58" />
					<circle cx="100" cy="100" r="26" />
					{#each Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4) as a}
						<line x1={100 + Math.cos(a) * 14} y1={100 + Math.sin(a) * 14} x2={100 + Math.cos(a) * 84} y2={100 + Math.sin(a) * 84} />
					{/each}
				</g>
				<circle cx="100" cy="100" r="10" fill="#5ad6c9" />
			</svg>
		</figure>
	</div>
</section>

<style>
	.about {
		background: var(--navy);
		border-top: 1px solid var(--line);
	}
	.para {
		color: var(--parchment-2);
		font-size: 1.08rem;
		max-width: 60ch;
	}
	.para + .para {
		margin-top: 16px;
	}
	.facts {
		display: grid;
		gap: 12px;
		margin: 28px 0 0;
	}
	.fact {
		display: grid;
		grid-template-columns: 100px 1fr;
		gap: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--line);
	}
	dt {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--teal);
		padding-top: 3px;
	}
	dd {
		margin: 0;
		display: grid;
		color: var(--parchment-2);
	}
	dd strong {
		color: var(--parchment);
		font-weight: 600;
	}
	dd span {
		font-size: 0.92rem;
		color: var(--muted);
	}
	@media (max-width: 520px) {
		.fact {
			grid-template-columns: 1fr;
			gap: 2px;
		}
	}
</style>
