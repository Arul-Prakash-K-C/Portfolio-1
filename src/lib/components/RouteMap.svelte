<!--
  A chart of the app's real screens, read from its source code.
  Used where no screenshot has been supplied yet, and labelled as such.
-->
<script>
	/** @type {{ groups: {group:string, items:string[]}[], title: string, compact?: boolean }} */
	let { groups, title, compact = false } = $props();
</script>

<figure class="map" class:compact>
	<div class="grid" aria-hidden="true"></div>
	<svg class="rose" viewBox="0 0 60 60" aria-hidden="true">
		<circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" stroke-width="1" />
		<path d="M30 4 L33 30 L30 56 L27 30 Z" fill="currentColor" />
		<path d="M4 30 L30 27 L56 30 L30 33 Z" fill="currentColor" opacity=".5" />
	</svg>
	<div class="islands">
		{#each groups as g, i}
			<div class="island" style="--i:{i}">
				<p class="g">{g.group}</p>
				{#if compact}
					<p class="n">{g.items.length} screens</p>
				{:else}
					<ul>
						{#each g.items as item}<li>{item}</li>{/each}
					</ul>
				{/if}
			</div>
		{/each}
	</div>
	<figcaption>
		{compact ? 'Route map from source' : `Route map of ${title}: screens and roles read from the project’s source code. Screenshots to be added.`}
	</figcaption>
</figure>

<style>
	.map {
		position: relative;
		margin: 0;
		height: 100%;
		min-height: 200px;
		padding: 18px 18px 40px;
		background:
			radial-gradient(120% 90% at 30% 20%, #f1e6cc 0%, #e2d2ae 60%, #c9b58a 100%);
		color: #2b2114;
		overflow: hidden;
		border-radius: inherit;
	}
	.grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(60, 42, 20, 0.12) 1px, transparent 1px),
			linear-gradient(90deg, rgba(60, 42, 20, 0.12) 1px, transparent 1px);
		background-size: 28px 28px;
	}
	.rose {
		position: absolute;
		right: 12px;
		top: 12px;
		width: 44px;
		color: #7a5520;
		opacity: 0.8;
	}
	.islands {
		position: relative;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}
	.island {
		border: 1.5px dashed rgba(90, 60, 25, 0.45);
		border-radius: 10px;
		padding: 8px 10px;
		background: rgba(255, 250, 238, 0.45);
	}
	.g {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.9rem;
		color: #3d2b12;
	}
	.n {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: #5a4424;
	}
	ul {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 10px;
		margin-top: 4px;
		font-size: 0.82rem;
		color: #3a2c18;
	}
	li::before {
		content: '✕ ';
		color: #a0461f;
		font-size: 0.65rem;
	}
	figcaption {
		position: absolute;
		left: 18px;
		right: 18px;
		bottom: 10px;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: #4d3a1e;
		letter-spacing: 0.02em;
	}
	.compact {
		padding: 16px 16px 36px;
	}
	.compact figcaption {
		left: 64px; /* clear of the card's number badge */
	}
	.compact .islands {
		gap: 8px;
		margin-right: 46px;
	}
	.map:not(.compact) figcaption {
		position: relative;
		left: 0;
		bottom: 0;
		margin-top: 14px;
	}
	.map:not(.compact) {
		padding-bottom: 16px;
	}
</style>
