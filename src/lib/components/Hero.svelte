<script>
	import SceneHost from './SceneHost.svelte';
	import { profile, experience } from '$lib/data/profile.js';
	import { projects } from '$lib/data/projects.js';

	/** @type {HTMLElement} */
	let heroEl = $state();
	const current = experience[0];
	const liveCount = projects.filter((p) => p.live).length;
</script>

<section id="home" class="hero" bind:this={heroEl} aria-labelledby="hero-title">
	<SceneHost {heroEl} />

	<div class="content container">
		<p class="eyebrow rise" style="--i:0">Captain’s log · {profile.location}</p>
		<h1 id="hero-title" class="rise" style="--i:1">
			<span class="name">{profile.name}</span>
			<span class="role">{profile.role}</span>
		</h1>
		<p class="lede rise" style="--i:2">{profile.tagline}</p>

		<div class="cta rise" style="--i:3">
			<a class="btn btn-primary" href="#projects">
				Explore Projects
				<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v11M3 8.5 8 13.5 13 8.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
			</a>
			{#if profile.resumeUrl}
				<a class="btn" href={profile.resumeUrl} target="_blank" rel="noopener">
					View Resume <span class="sr-only">(PDF, opens in a new tab)</span>
				</a>
			{/if}
			<a class="btn btn-ghost" href="#contact">Contact Me</a>
		</div>

		<dl class="facts rise" style="--i:4">
			<div>
				<dt>Now</dt>
				<dd>{current.title}, {current.org}</dd>
			</div>
			<div>
				<dt>Studying</dt>
				<dd>MCA, Sona College of Technology</dd>
			</div>
			<div>
				<dt>Shipped</dt>
				<dd>{liveCount} live web apps in the voyage log</dd>
			</div>
		</dl>
	</div>

	<a class="scroll-cue" href="#projects">
		<span class="sr-only">Skip to projects</span>
		<span class="mouse" aria-hidden="true"><span></span></span>
		<span class="cue-text" aria-hidden="true">Set sail</span>
	</a>
</section>

<style>
	.hero {
		position: relative;
		min-height: 100svh;
		min-height: max(100svh, 640px);
		display: flex;
		align-items: center;
		overflow: hidden;
		isolation: isolate;
	}
	.content {
		position: relative;
		z-index: 2;
		padding: calc(var(--nav-h) + 48px) 0 120px;
		max-width: var(--max);
	}
	h1 {
		display: grid;
		gap: 10px;
		margin: 18px 0 22px;
	}
	.name {
		font-size: clamp(2.6rem, 7.4vw, 5.6rem);
		line-height: 1;
		color: var(--parchment);
		text-shadow: 0 2px 30px rgba(0, 0, 0, 0.5);
		max-width: 12ch;
	}
	.role {
		font-family: var(--font-mono);
		font-weight: 500;
		font-size: clamp(1rem, 2.2vw, 1.3rem);
		letter-spacing: 0.08em;
		color: var(--brass-2);
		text-transform: uppercase;
	}
	.role::before {
		content: '> ';
		color: var(--teal);
	}
	.lede {
		max-width: 54ch;
		font-size: clamp(1.02rem, 1.6vw, 1.18rem);
		color: #d6dbe4;
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.6);
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 32px;
	}
	.facts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 290px));
		justify-content: start;
		gap: 14px 30px;
		margin: 44px 0 0;
		max-width: 940px;
	}
	.facts div {
		border-left: 2px solid var(--brass);
		padding-left: 12px;
	}
	.facts dt {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--teal);
	}
	.facts dd {
		margin: 2px 0 0;
		font-size: 0.93rem;
		color: var(--parchment-2);
	}

	/* fast, non-blocking entrance */
	.rise {
		animation: rise 0.8s var(--ease-out) both;
		animation-delay: calc(var(--i) * 90ms + 80ms);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
	}

	.scroll-cue {
		position: absolute;
		left: 50%;
		bottom: 24px;
		transform: translateX(-50%);
		z-index: 2;
		display: grid;
		justify-items: center;
		gap: 6px;
		color: var(--parchment-2);
		text-decoration: none;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		padding: 6px;
	}
	.mouse {
		width: 22px;
		height: 34px;
		border: 1.5px solid currentColor;
		border-radius: 12px;
		display: grid;
		justify-items: center;
		padding-top: 6px;
	}
	.mouse span {
		width: 3px;
		height: 7px;
		border-radius: 2px;
		background: var(--brass-2);
		animation: wheel 1.8s var(--ease-sail) infinite;
	}
	@keyframes wheel {
		0% {
			transform: translateY(0);
			opacity: 1;
		}
		70% {
			transform: translateY(9px);
			opacity: 0;
		}
		100% {
			opacity: 0;
		}
	}
	@media (max-width: 860px) {
		.facts {
			grid-template-columns: 1fr;
		}
		.content {
			padding-top: calc(var(--nav-h) + 34svh);
		}
		.scroll-cue {
			display: none;
		}
	}
</style>
