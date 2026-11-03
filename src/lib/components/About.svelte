<script>
	import { about, education, experience, profile } from '$lib/data/profile.js';
	import { reveal } from '$lib/actions.js';
	import CaptainPortrait from './CaptainPortrait.svelte';

	const current = experience[0];
</script>

<section id="about" class="section stage-section about" aria-labelledby="about-title" data-stage-offset="0.04">
	<!-- With the 3D voyage on, the section opens on a clear shot of the captain at the wheel:
	     the captain turns to camera, salutes, and goes back to steering before the log scrolls up. -->
	<div class="stage-window" aria-hidden="true">
		<p class="stage-cue">The captain salutes · then back to the wheel</p>
	</div>
	<div class="container split">
		<div class="panel reveal" use:reveal>
			<div class="intro-head">
				<header class="section-head">
					<p class="eyebrow">Log 01 · The captain at the wheel</p>
					<h2 id="about-title" class="section-title">About</h2>
				</header>
				{#if profile.portrait}
					<figure class="portrait">
						<img
							src={profile.portrait.srcSmall}
							srcset={`${profile.portrait.srcSmall} 320w, ${profile.portrait.src} 640w`}
							sizes="(max-width: 520px) 140px, 180px"
							alt={profile.portrait.alt}
							width="320"
							height="400"
							loading="lazy"
							decoding="async"
						/>
					</figure>
				{/if}
			</div>
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

		{#if profile.captainPortrait}
			<CaptainPortrait {...profile.captainPortrait} />
		{:else}
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
		{/if}
	</div>
</section>

<style>
	.about {
		background: var(--navy);
		border-top: 1px solid var(--line);
	}
	.stage-window {
		display: none;
	}
	:global(html.scene-live) .about {
		flex-direction: column;
		align-items: stretch;
	}
	:global(html.scene-live) .about .stage-window {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		height: 86svh;
		position: relative;
		z-index: 1;
	}
	.stage-cue {
		padding: 0 16px;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--parchment-2);
		opacity: 0.75;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
		margin: 0 0 18px;
	}
	@media (max-width: 759px) {
		:global(html.scene-live) .about {
			padding-top: 0;
		}
		:global(html.scene-live) .about .stage-window {
			height: 72svh;
		}
	}
	.intro-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
	}
	/* brass-framed portrait with a light moonlit grade; the photo itself is unaltered */
	.portrait {
		position: relative;
		flex: none;
		width: 180px;
		margin: 0 0 18px;
		padding: 6px;
		border-radius: 14px;
		background: linear-gradient(145deg, #f0c470, #8a6224 55%, #d9a84e);
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
		transform: rotate(1.5deg);
		transition: transform var(--t-med) var(--ease-out);
	}
	.portrait:hover {
		transform: rotate(0deg) translateY(-2px);
	}
	.portrait img {
		width: 100%;
		height: auto;
		aspect-ratio: 4 / 5;
		object-fit: cover;
		border-radius: 9px;
		filter: contrast(1.05) saturate(0.92);
	}
	.portrait::after {
		content: '';
		position: absolute;
		inset: 6px;
		border-radius: 9px;
		pointer-events: none;
		background:
			radial-gradient(120% 90% at 50% 30%, transparent 55%, rgba(5, 10, 20, 0.45) 100%),
			linear-gradient(160deg, rgba(90, 214, 201, 0.12), rgba(217, 168, 78, 0.1));
		mix-blend-mode: soft-light;
	}
	@media (max-width: 520px) {
		.intro-head {
			flex-direction: column-reverse;
		}
		.portrait {
			width: 140px;
		}
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
