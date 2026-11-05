<script>
	import { certifications } from '$lib/data/profile.js';
	import { ports } from '$lib/data/voyage.js';
	import { onMount } from 'svelte';

	/** @type {HTMLElement} */
	let scroll;
	/** @type {HTMLElement} */
	let sheet;
	let unfurled = $state(false);

	// unroll the captain's log once it is well into view (once only)
	onMount(() => {
		// the bottom roller starts tucked against the top one
		scroll.style.setProperty('--roll', `-${sheet.offsetHeight}px`);
		if (typeof IntersectionObserver === 'undefined') {
			unfurled = true;
			return;
		}
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					unfurled = true;
					io.disconnect();
				}
			},
			{ rootMargin: '0px 0px -25% 0px', threshold: 0.05 }
		);
		io.observe(scroll);
		return () => io.disconnect();
	});
</script>

<section id="experience" class="section stage-section experience" aria-labelledby="exp-title">
	<div class="container log-wrap">
		<!-- The captain's log: a parchment scroll that unrolls, then each real entry is inked in turn.
		     All text is ordinary, selectable DOM; the animation only moves the paper and fades the ink. -->
		<article class="scroll" class:unfurled bind:this={scroll} aria-labelledby="exp-title">
			<div class="roller top" aria-hidden="true"></div>
			<div class="sheet" bind:this={sheet}>
				<header class="head">
					<p class="kicker">Log 04 · The captain’s log</p>
					<h2 id="exp-title">Experience &amp; education</h2>
				</header>
				<ol class="entries">
					{#each ports as p, i}
						<li class="entry" style="--i:{i}">
							<p class="meta"><span class="kind">{p.kind}</span><span class="period">{p.period}</span></p>
							<h3>{p.title}</h3>
							<p class="org">{p.org}</p>
							{#if p.points.length}
								<ul class="points">
									{#each p.points as pt}<li>{pt}</li>{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ol>

				{#if certifications.length}
					<section class="certs" aria-labelledby="log-certs">
						<h3 id="log-certs">Certifications</h3>
						<ol class="entries">
							{#each certifications as c}
								<li class="entry">
									<p class="meta"><span class="period">{c.date}</span></p>
									<h4>{c.name}</h4>
									<p class="org">{c.issuer}</p>
									{#if c.url}<a href={c.url} target="_blank" rel="noopener">View credential ↗<span class="sr-only"> (opens in a new tab)</span></a>{/if}
								</li>
							{/each}
						</ol>
					</section>
				{/if}
			</div>
			<div class="roller bottom" aria-hidden="true"></div>
		</article>
	</div>
</section>

<style>
	.experience {
		background: #06121a;
		border-top: 1px solid rgba(90, 214, 201, 0.12);
	}
	.log-wrap {
		display: flex;
	}
	.scroll {
		position: relative;
		width: min(560px, 100%);
		filter: drop-shadow(0 30px 60px rgba(0, 0, 0, 0.55));
	}
	/* wooden rollers with brass end caps */
	.roller {
		position: relative;
		height: 26px;
		margin: 0 -14px;
		border-radius: 13px;
		background:
			radial-gradient(circle at 7px 50%, #e0b25c 0 6px, #7a5622 7px, transparent 8px),
			radial-gradient(circle at calc(100% - 7px) 50%, #e0b25c 0 6px, #7a5622 7px, transparent 8px),
			linear-gradient(180deg, #6b4423, #3d2412 55%, #2a170b);
		z-index: 2;
	}
	.sheet {
		position: relative;
		padding: clamp(26px, 4vw, 44px) clamp(22px, 4vw, 44px);
		color: #2b2114;
		background:
			radial-gradient(120% 60% at 50% 0%, rgba(120, 80, 30, 0.18), transparent 60%),
			radial-gradient(90% 50% at 10% 100%, rgba(110, 70, 25, 0.22), transparent 70%),
			repeating-linear-gradient(0deg, rgba(90, 60, 25, 0.035) 0 2px, transparent 2px 5px),
			linear-gradient(170deg, #f3e7cb, #e2cf9f 60%, #d8c18c);
		box-shadow:
			inset 0 12px 18px -10px rgba(60, 35, 10, 0.55),
			inset 0 -12px 18px -10px rgba(60, 35, 10, 0.55),
			inset 14px 0 30px -18px rgba(80, 50, 15, 0.5),
			inset -14px 0 30px -18px rgba(80, 50, 15, 0.5);
		transform-origin: 50% 0;
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
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		color: #2b2114;
		margin-top: 6px;
	}
	.entries {
		list-style: none;
		padding: 0;
		margin: 22px 0 0;
		display: grid;
		gap: 0;
	}
	.entry {
		padding: 16px 0 16px 22px;
		border-top: 1px dashed rgba(90, 60, 25, 0.38);
		position: relative;
	}
	.entry::before {
		/* a small ink mark in the margin */
		content: '';
		position: absolute;
		left: 2px;
		top: 24px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #6a2a22;
		box-shadow: 0 0 0 3px rgba(106, 42, 34, 0.15);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		align-items: baseline;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.kind {
		color: #0d5e57;
		font-weight: 700;
	}
	.period {
		color: #5a4424;
	}
	h3 {
		font-size: 1.22rem;
		color: #2b2114;
		margin-top: 4px;
	}
	h4 {
		font-size: 1.05rem;
		color: #2b2114;
	}
	.org {
		color: #3d2e18;
	}
	.points {
		margin-top: 6px;
		padding-left: 18px;
		color: #3d2e18;
	}
	.certs {
		margin-top: 18px;
	}
	.certs h3 {
		color: #6a4614;
	}
	a {
		color: #0d5e57;
	}

	/* ---------- unfurl (JS on, motion allowed): paper rolls down, then each entry is inked ---------- */
	@media (prefers-reduced-motion: no-preference) {
		:global(.js) .scroll:not(.unfurled) .sheet {
			transform: scaleY(0.04);
		}
		:global(.js) .scroll:not(.unfurled) .roller.bottom {
			transform: translateY(var(--roll, -480px));
		}
		:global(.js) .scroll:not(.unfurled) .head,
		:global(.js) .scroll:not(.unfurled) .entry {
			opacity: 0;
			transform: translateY(8px);
		}
		.sheet {
			transition: transform 1.1s cubic-bezier(0.22, 0.8, 0.2, 1);
		}
		.roller.bottom {
			transition: transform 1.1s cubic-bezier(0.22, 0.8, 0.2, 1);
		}
		.head,
		.entry {
			transition:
				opacity 0.6s ease,
				transform 0.6s ease;
		}
		.unfurled .head {
			transition-delay: 0.7s;
		}
		.unfurled .entry {
			transition-delay: calc(0.95s + var(--i, 0) * 0.22s);
		}
	}
	@media (max-width: 759px) {
		:global(html.scene-live) .experience {
			padding-top: 40svh;
		}
		.roller {
			margin: 0 -8px;
		}
	}
</style>
