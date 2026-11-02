<script>
	import RouteMap from './RouteMap.svelte';

	/** @type {{ project: any, onclose: () => void }} */
	let { project, onclose } = $props();

	/** @type {HTMLDialogElement} */
	let dialog;
	let shot = $state(0);

	$effect(() => {
		if (project && dialog && !dialog.open) {
			shot = 0;
			dialog.showModal();
			dialog.scrollTop = 0;
		}
	});

	function close() {
		dialog?.close();
	}

	/** @param {MouseEvent} e */
	function backdrop(e) {
		if (e.target === dialog) close();
	}
</script>

<dialog
	bind:this={dialog}
	class="case"
	aria-labelledby="case-title"
	onclose={onclose}
	onclick={backdrop}
>
	{#if project}
		<article class="sheet">
			<header class="head">
				<div>
					<p class="eyebrow">Mission file · {project.year} · {project.status}</p>
					<h2 id="case-title">{project.title}</h2>
					<p class="kicker">{project.kicker}</p>
				</div>
				<button class="x" type="button" onclick={close} aria-label="Close case study">
					<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 4l12 12M16 4 4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
				</button>
			</header>

			<div class="links">
				{#if project.live}
					<a class="btn btn-primary btn-sm" href={project.live} target="_blank" rel="noopener">
						Try the live project ↗<span class="sr-only"> (opens in a new tab)</span>
					</a>
				{/if}
				{#if project.source}
					<a class="btn btn-sm" href={project.source} target="_blank" rel="noopener">
						Source code ↗<span class="sr-only"> (GitHub, opens in a new tab)</span>
					</a>
				{/if}
			</div>

			<div class="media">
				{#if project.shots.length}
					<figure class="shot">
						<img
							src={project.shots[shot].src}
							alt={project.shots[shot].alt}
							loading="lazy"
							decoding="async"
						/>
						<figcaption>{project.shots[shot].alt}</figcaption>
					</figure>
					{#if project.shots.length > 1}
						<div class="thumbs" role="group" aria-label="Screenshots">
							{#each project.shots as s, i}
								<button
									type="button"
									class="thumb"
									aria-pressed={shot === i}
									aria-label={`Screenshot ${i + 1} of ${project.shots.length}`}
									onclick={() => (shot = i)}
								>
									<img src={s.src} alt="" loading="lazy" />
								</button>
							{/each}
						</div>
					{/if}
				{:else if project.routeMap}
					<RouteMap groups={project.routeMap} title={project.title} />
				{/if}
			</div>

			<div class="body">
				<p class="summary">{project.summary}</p>

				<dl class="fields">
					<div>
						<dt>Problem / goal</dt>
						<dd>{project.problem}</dd>
					</div>
					<div>
						<dt>Intended users</dt>
						<dd>{project.users}</dd>
					</div>
					<div>
						<dt>Arul’s role</dt>
						<dd>{project.role} <span class="muted">({project.team})</span></dd>
					</div>
				</dl>

				<section>
					<h3>Main features</h3>
					<ul class="ticks">
						{#each project.features as f}<li>{f}</li>{/each}
					</ul>
				</section>

				<section>
					<h3>Architecture &amp; data flow</h3>
					<p>{project.architecture}</p>
				</section>

				<section>
					<h3>Technology</h3>
					<ul class="chips">
						{#each project.stack as s}<li class="chip chip-teal">{s}</li>{/each}
					</ul>
				</section>

				<section>
					<h3>Implementation choices</h3>
					<ul class="ticks">
						{#each project.choices as c}<li>{c}</li>{/each}
					</ul>
				</section>

				{#if project.outcomes?.length}
					<section>
						<h3>Reported results</h3>
						<ul class="ticks">
							{#each project.outcomes as o}<li>{o}</li>{/each}
						</ul>
					</section>
				{/if}

				<p class="evidence"><strong>Source of these details:</strong> {project.evidence}</p>
			</div>
		</article>
	{/if}
</dialog>

<style>
	.case {
		width: min(920px, calc(100% - 24px));
		max-height: calc(100dvh - 24px);
		padding: 0;
		border: 1px solid var(--line-strong);
		border-radius: 18px;
		background: var(--navy);
		color: var(--parchment);
		overflow: auto;
		overscroll-behavior: contain;
		box-shadow: 0 40px 120px rgba(0, 0, 0, 0.6);
	}
	.case[open] {
		animation: open 0.45s var(--ease-out);
	}
	.case::backdrop {
		background: rgba(3, 6, 12, 0.78);
		backdrop-filter: blur(4px);
	}
	@keyframes open {
		from {
			opacity: 0;
			transform: translateY(18px) scale(0.98);
		}
	}
	.sheet {
		padding: clamp(20px, 4vw, 40px);
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
	}
	h2 {
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		margin-top: 8px;
	}
	.kicker {
		color: var(--brass-2);
		margin-top: 4px;
	}
	.x {
		flex: none;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1px solid var(--line-strong);
		background: transparent;
		cursor: pointer;
	}
	.x:hover {
		border-color: var(--brass);
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 20px 0 24px;
	}
	.media {
		border-radius: var(--radius);
		overflow: hidden;
		border: 1px solid var(--line);
		background: #050a14;
	}
	.shot {
		margin: 0;
	}
	.shot img {
		width: 100%;
		max-height: 520px;
		object-fit: contain;
		background: #fff;
	}
	.shot figcaption {
		padding: 10px 14px;
		font-size: 0.85rem;
		color: var(--muted);
		border-top: 1px solid var(--line);
	}
	.thumbs {
		display: flex;
		gap: 8px;
		padding: 10px;
		overflow-x: auto;
		border-top: 1px solid var(--line);
	}
	.thumb {
		flex: none;
		width: 96px;
		height: 60px;
		padding: 0;
		border-radius: 8px;
		overflow: hidden;
		border: 2px solid transparent;
		background: #fff;
		cursor: pointer;
		opacity: 0.65;
		transition: opacity var(--t-fast), border-color var(--t-fast);
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
	}
	.thumb[aria-pressed='true'],
	.thumb:hover {
		opacity: 1;
		border-color: var(--brass);
	}
	.body {
		display: grid;
		gap: 26px;
		margin-top: 28px;
	}
	.summary {
		font-size: 1.12rem;
		color: #e2e6ee;
	}
	.fields {
		display: grid;
		gap: 14px;
		margin: 0;
	}
	.fields div {
		display: grid;
		grid-template-columns: 160px 1fr;
		gap: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--line);
	}
	dt {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--teal);
		padding-top: 3px;
	}
	dd {
		margin: 0;
		color: var(--parchment-2);
	}
	.muted {
		color: var(--muted);
	}
	h3 {
		font-size: 1.15rem;
		color: var(--brass-2);
		margin-bottom: 10px;
	}
	section p {
		color: var(--parchment-2);
	}
	.ticks {
		list-style: none;
		display: grid;
		gap: 8px;
		color: var(--parchment-2);
	}
	.ticks li {
		position: relative;
		padding-left: 24px;
	}
	.ticks li::before {
		content: '';
		position: absolute;
		left: 2px;
		top: 0.62em;
		width: 9px;
		height: 9px;
		border: 1.5px solid var(--brass);
		transform: rotate(45deg);
	}
	.evidence {
		font-size: 0.88rem;
		color: var(--muted);
		padding: 12px 14px;
		border: 1px dashed var(--line-strong);
		border-radius: var(--radius-sm);
	}
	.evidence strong {
		color: var(--parchment-2);
	}
	@media (max-width: 640px) {
		.fields div {
			grid-template-columns: 1fr;
			gap: 4px;
		}
	}
</style>
