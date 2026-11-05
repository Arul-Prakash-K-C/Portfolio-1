<script>
	import { projects, logEntries } from '$lib/data/projects.js';
	import { reveal } from '$lib/actions.js';
	import RouteMap from './RouteMap.svelte';
	import CaseStudy from './CaseStudy.svelte';

	/** @type {any} */
	let selected = $state(null);
	/** @type {HTMLElement | null} */
	let returnFocus = null;

	function chartReveal(node) {
		node.classList.add('chart-pending');
		if (typeof IntersectionObserver === 'undefined') {
			node.classList.add('chart-arrived');
			return {};
		}
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				node.classList.add('chart-arrived');
				observer.disconnect();
			}
		}, { rootMargin: '0px 0px -10% 0px', threshold: 0.14 });
		observer.observe(node);
		return { destroy: () => observer.disconnect() };
	}

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

		<div class="chart-route">
			<div class="chart-backdrop" aria-hidden="true">
				<svg viewBox="0 0 1000 1600" preserveAspectRatio="none">
					<defs>
						<linearGradient id="route-ink" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stop-color="#bd8740" stop-opacity="0.05" />
							<stop offset="0.12" stop-color="#bd8740" stop-opacity="0.9" />
							<stop offset="0.88" stop-color="#bd8740" stop-opacity="0.9" />
							<stop offset="1" stop-color="#bd8740" stop-opacity="0.05" />
						</linearGradient>
						<pattern id="chart-grain" width="52" height="52" patternUnits="userSpaceOnUse">
							<circle cx="7" cy="11" r="1" fill="#c69a58" fill-opacity=".18" />
							<circle cx="37" cy="39" r=".8" fill="#c69a58" fill-opacity=".14" />
							<path d="M0 26h52M26 0v52" stroke="#c69a58" stroke-opacity=".06" stroke-width=".6" />
						</pattern>
					</defs>
					<rect width="1000" height="1600" fill="url(#chart-grain)" />
					<g fill="none" stroke="#9c7544" stroke-opacity=".18" stroke-width="2">
						<path d="M80 150C180 70 260 200 355 124s184-5 264-61 211 54 320 8" />
						<path d="M52 182C168 92 244 232 340 154s185-6 271-65 219 55 343 9" />
						<path d="M42 218C146 127 227 269 326 190s202-10 289-68 223 50 348 4" />
						<path d="M63 1490c114-96 206 27 292-53s178 21 270-55 182 39 302-36" />
						<path d="M36 1532c130-102 214 18 312-61s176 28 284-55 180 43 319-39" />
					</g>
					<path class="route-line" d="M520 36C396 140 632 208 474 316s106 182 4 300 138 172 42 298-162 142-33 284 3 185-26 300 67 107 41 187" />
					<g class="chart-islands">
						<path d="M112 370c18-48 64-64 93-36 21 18 47 5 60 31 18 37-14 75-50 76-23 1-35 25-68 14-33-10-51-48-35-85Z" />
						<path d="M723 610c18-38 66-61 94-39 23 18 48 11 59 39 15 36-20 70-50 72-30 3-38 23-72 11-31-12-46-48-31-83Z" />
						<path d="M142 1032c16-43 59-67 91-46 22 15 45 14 57 41 17 39-18 68-49 74-33 7-39 29-74 16-33-12-39-49-25-85Z" />
						<path d="M745 1338c19-42 61-53 87-31 22 18 51 12 58 40 10 37-26 64-56 64-26 0-41 20-72 5-31-15-31-50-17-78Z" />
					</g>
					<g class="waypoints">
						<circle cx="512" cy="205" r="10" /><circle cx="482" cy="515" r="10" />
						<circle cx="538" cy="825" r="10" /><circle cx="482" cy="1134" r="10" /><circle cx="520" cy="1433" r="10" />
					</g>
				</svg>
				<div class="chart-rose"><span>N</span><i>✦</i><small>W · E · S</small></div>
			</div>
			<ol class="grid">
			{#each projects as p, i}
				<li class="card map-card" use:chartReveal style="--d:{(i % 2) * 90}ms; --n:{i}">
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
		</div>

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
	.chart-route { position: relative; isolation: isolate; padding: 24px 0; }
	.chart-backdrop {
		position: absolute;
		inset: -24px max(-18vw, -220px);
		z-index: -1;
		pointer-events: none;
		opacity: .52;
		mask-image: linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent);
	}
	.chart-backdrop svg { display: block; width: 100%; height: 100%; min-height: 1350px; overflow: visible; }
	.chart-backdrop rect { opacity: .35; }
	.route-line { fill:none; stroke:url(#route-ink); stroke-width:3; stroke-dasharray:3 12; stroke-linecap:round; }
	.chart-islands { fill:#6c805e; stroke:#b69560; stroke-width:4; stroke-opacity:.45; }
	.waypoints { fill:#e6c27e; stroke:#19202a; stroke-width:7; }
	.waypoints circle { filter: drop-shadow(0 0 9px rgba(230,194,126,.42)); }
	.chart-rose { position:absolute; top:28px; right:6%; color:#d8bc84; display:grid; justify-items:center; opacity:.62; font-family:var(--font-mono); font-size:.68rem; letter-spacing:.2em; }
	.chart-rose i { font-style:normal; font-size:2rem; line-height:1.1; }
	.grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: clamp(54px, 8vw, 108px);
	}
	.map-card { width: min(100%, 690px); transform-origin: 50% 20%; transition: opacity 800ms ease, transform 1100ms cubic-bezier(.16,.82,.22,1), filter 900ms ease; }
	.map-card:nth-child(even) { margin-left: auto; }
	:global(.map-card.chart-pending) { opacity: 0; transform: translate3d(0, 88px, 0) scale(.91) rotate(-1.2deg); filter: blur(6px); }
	:global(.map-card.chart-arrived) { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0); filter: blur(0); transition-delay: var(--d); }
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
		background: #0b1521;
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
		.entries {
			grid-template-columns: 1fr;
		}
		.chart-backdrop { inset-inline: -18vw; opacity:.34; }
		.chart-rose { right: 8%; }
		.map-card, .map-card:nth-child(even) { width:100%; margin-left:0; }
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.map-card.chart-pending) { opacity: 1; transform: none; filter: none; }
		.map-card, :global(.map-card.chart-arrived) { transition:none; }
	}
</style>
