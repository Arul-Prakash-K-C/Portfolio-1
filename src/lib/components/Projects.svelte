<script>
	import { projects, logEntries } from '$lib/data/projects.js';
	import { reveal } from '$lib/actions.js';
	import RouteMap from './RouteMap.svelte';
	import CaseStudy from './CaseStudy.svelte';

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
			<p class="eyebrow">Log 01 · The voyage log</p>
			<h2 id="projects-title" class="section-title">Projects</h2>
			<p class="section-lede">
				Full-stack apps built and shipped in 2026. Open any entry for the mission file: the goal, users,
				Arul’s role, features, architecture and where each detail comes from.
			</p>
		</header>

		<ol class="grid">
			{#each projects as p, i}
				<li class="card reveal" use:reveal style="--d:{(i % 2) * 90}ms">
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
						<h3>{p.title}</h3>
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

<CaseStudy project={selected} onclose={closed} />

<style>
	.projects {
		background:
			radial-gradient(80% 60% at 85% 0%, rgba(90, 214, 201, 0.06), transparent 60%),
			linear-gradient(180deg, var(--ink), var(--navy) 30%, var(--navy));
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
