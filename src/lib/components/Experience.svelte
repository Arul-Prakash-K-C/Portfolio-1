<script>
	import { experience, certifications } from '$lib/data/profile.js';
	import { reveal } from '$lib/actions.js';

	// Academic project work, from the supplied project reports.
	const academic = [
		{
			title: 'Project-Sync',
			course: 'P23MCA303 · Advanced Web Programming',
			org: 'Sona College of Technology',
			period: 'Oct 2026',
			team: 'Team of four'
		},
		{
			title: 'SafeScan',
			course: 'P23MCA306 · Mini Project',
			org: 'Sona College of Technology',
			period: 'Jul – Oct 2026',
			team: 'Team of three'
		}
	];
</script>

<section id="experience" class="section experience" aria-labelledby="exp-title">
	<div class="container">
		<header class="section-head reveal" use:reveal>
			<p class="eyebrow">Log 04 · Crew record</p>
			<h2 id="exp-title" class="section-title">Experience</h2>
		</header>

		<div class="cols">
			<div>
				<h3 class="sub">Work</h3>
				<ul class="cards">
					{#each experience as e}
						<li class="card reveal" use:reveal>
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
				</ul>
			</div>

			<div>
				<h3 class="sub">Academic project work</h3>
				<ul class="cards">
					{#each academic as a, i}
						<li class="card reveal" use:reveal style="--d:{i * 80}ms">
							<p class="period">{a.period}</p>
							<h4>{a.title}</h4>
							<p class="org">{a.course}</p>
							<p class="meta">{a.org} · {a.team}</p>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		{#if certifications.length}
			<div class="certs">
				<h3 class="sub">Certifications</h3>
				<ul class="cards cert-grid">
					{#each certifications as c}
						<li class="card">
							<p class="period">{c.date}</p>
							<h4>{c.name}</h4>
							<p class="org">{c.issuer}</p>
							{#if c.url}<a href={c.url} target="_blank" rel="noopener">View credential ↗</a>{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</section>

<style>
	.experience {
		background: #06121a;
		border-top: 1px solid rgba(90, 214, 201, 0.12);
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(24px, 5vw, 56px);
	}
	.sub {
		font-family: var(--font-mono);
		font-weight: 500;
		font-size: 0.8rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--teal);
		margin-bottom: 14px;
	}
	.cards {
		list-style: none;
		display: grid;
		gap: 14px;
	}
	.card {
		padding: 20px 22px;
		border-radius: var(--radius);
		border: 1px solid var(--line);
		border-left: 3px solid var(--brass);
		background: rgba(239, 228, 204, 0.03);
	}
	.period {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--brass-2);
	}
	h4 {
		font-size: 1.2rem;
		margin-top: 4px;
	}
	.org {
		color: var(--parchment-2);
		margin-top: 2px;
	}
	.meta {
		color: var(--muted);
		font-size: 0.9rem;
		margin-top: 2px;
	}
	.points {
		margin-top: 10px;
		padding-left: 18px;
		color: var(--parchment-2);
	}
	.certs {
		margin-top: 44px;
	}
	.cert-grid {
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	}
	@media (max-width: 760px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
