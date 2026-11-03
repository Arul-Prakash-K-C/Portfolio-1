<script>
	import { experience, education, certifications } from '$lib/data/profile.js';
	import { reveal } from '$lib/actions.js';

	// Academic project work, from the supplied project reports.
	const academic = [
		{ title: 'Project-Sync', detail: 'P23MCA303 · Advanced Web Programming · team of four', period: 'Oct 2026' },
		{ title: 'SafeScan', detail: 'P23MCA306 · Mini Project · team of three', period: 'Jul – Oct 2026' }
	];
</script>

<section id="experience" class="section stage-section experience" aria-labelledby="exp-title">
	<div class="container split">
		<div class="book reveal" use:reveal>
			<header class="head">
				<p class="kicker">Log 04 · The ship’s log</p>
				<h2 id="exp-title">Experience &amp; education</h2>
			</header>

			<section aria-labelledby="log-work">
				<h3 id="log-work">Crew record</h3>
				<ol class="entries">
					{#each experience as e}
						<li>
							<p class="period">{e.period}</p>
							<h4>{e.title}</h4>
							<p class="org">{e.org}</p>
							{#if e.points.length}
								<ul class="points">
									{#each e.points as pt}<li>{pt}</li>{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ol>
			</section>

			<section aria-labelledby="log-study">
				<h3 id="log-study">Ports of study</h3>
				<ol class="entries">
					{#each education as e}
						<li>
							<p class="period">{e.period}</p>
							<h4>{e.title}</h4>
							<p class="org">{e.org}</p>
						</li>
					{/each}
				</ol>
			</section>

			<section aria-labelledby="log-academic">
				<h3 id="log-academic">Course projects</h3>
				<ol class="entries">
					{#each academic as a}
						<li>
							<p class="period">{a.period}</p>
							<h4>{a.title}</h4>
							<p class="org">{a.detail}</p>
						</li>
					{/each}
				</ol>
			</section>

			{#if certifications.length}
				<section aria-labelledby="log-certs">
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
		<div aria-hidden="true"></div>
	</div>
</section>

<style>
	.experience {
		background: #06121a;
		border-top: 1px solid rgba(90, 214, 201, 0.12);
	}
	.book {
		position: relative;
		padding: clamp(24px, 3.4vw, 40px);
		border-radius: 18px;
		background: linear-gradient(160deg, #f1e6cd, #dccca6);
		color: #2b2114;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
		display: grid;
		gap: 24px;
	}
	.book::before {
		content: '';
		position: absolute;
		inset: 10px;
		border: 1px solid rgba(90, 60, 25, 0.3);
		border-radius: 12px;
		pointer-events: none;
	}
	.kicker {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #0d5e57;
		font-weight: 700;
	}
	h2 {
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		color: #2b2114;
		margin-top: 6px;
	}
	h3 {
		font-size: 1.05rem;
		color: #6a4614;
		padding-bottom: 6px;
		border-bottom: 1px dashed rgba(90, 60, 25, 0.4);
		margin-bottom: 12px;
	}
	.entries {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 14px;
	}
	.period {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: #5a4424;
	}
	h4 {
		font-size: 1.1rem;
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
	a {
		color: #0d5e57;
	}
</style>
