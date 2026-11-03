<!--
  Cinematic frame for Arul's pirate-captain portrait (an image Arul supplies,
  e.g. generated from his own photo). Layers: the portrait with a slow
  push-in, drifting sea fog, a flickering lantern glow, film grain and a
  vignette, plus gentle scroll parallax. All motion stops under
  prefers-reduced-motion; the image itself is never altered.
-->
<script>
	import { onMount } from 'svelte';

	/** @type {{ src: string, srcSmall?: string, alt: string, caption?: string }} */
	let { src, srcSmall, alt, caption = '' } = $props();

	/** @type {HTMLElement} */
	let frame;
	let shift = $state(0);

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let ticking = false;
		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				ticking = false;
				const r = frame.getBoundingClientRect();
				// -1 when the frame enters at the bottom, +1 when it leaves at the top
				const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
				shift = Math.max(-1, Math.min(1, p));
			});
		};
		onScroll();
		addEventListener('scroll', onScroll, { passive: true });
		return () => removeEventListener('scroll', onScroll);
	});
</script>

<figure class="captain" bind:this={frame} style:--shift={shift}>
	<div class="window">
		<img
			class="photo"
			src={srcSmall ?? src}
			srcset={srcSmall ? `${srcSmall} 640w, ${src} 1280w` : undefined}
			sizes="(max-width: 900px) 90vw, 460px"
			{alt}
			loading="lazy"
			decoding="async"
		/>
		<div class="fog fog-a" aria-hidden="true"></div>
		<div class="fog fog-b" aria-hidden="true"></div>
		<div class="lantern" aria-hidden="true"></div>
		<div class="grain" aria-hidden="true"></div>
		<div class="vignette" aria-hidden="true"></div>
	</div>
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	.captain {
		margin: 0;
		width: min(460px, 100%);
		justify-self: center;
		transform: translateY(calc(var(--shift, 0) * -18px));
	}
	.window {
		position: relative;
		overflow: hidden;
		aspect-ratio: 4 / 5;
		border-radius: 18px;
		padding: 0;
		background: #050a14;
		box-shadow:
			0 0 0 1px rgba(217, 168, 78, 0.55),
			0 0 0 7px rgba(10, 16, 26, 0.9),
			0 0 0 8px rgba(217, 168, 78, 0.35),
			0 40px 90px rgba(0, 0, 0, 0.6);
	}
	.photo {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform: translateY(calc(var(--shift, 0) * 8px)) scale(1.1);
		animation: push 18s var(--ease-sail) infinite alternate;
	}
	@keyframes push {
		to {
			transform: translateY(calc(var(--shift, 0) * 8px)) scale(1.04);
		}
	}
	.fog {
		position: absolute;
		inset: -20% -40%;
		pointer-events: none;
		background:
			radial-gradient(40% 18% at 30% 82%, rgba(150, 170, 200, 0.28), transparent 70%),
			radial-gradient(35% 14% at 70% 90%, rgba(150, 170, 200, 0.22), transparent 70%);
		mix-blend-mode: screen;
		animation: drift 26s linear infinite;
	}
	.fog-b {
		animation-duration: 38s;
		animation-direction: reverse;
		opacity: 0.7;
		top: -10%;
	}
	@keyframes drift {
		from {
			transform: translateX(-12%);
		}
		to {
			transform: translateX(12%);
		}
	}
	.lantern {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(60% 50% at 18% 30%, rgba(255, 170, 80, 0.22), transparent 70%);
		mix-blend-mode: soft-light;
		animation: flicker 3.2s steps(1) infinite;
	}
	@keyframes flicker {
		0%,
		100% {
			opacity: 1;
		}
		23% {
			opacity: 0.82;
		}
		41% {
			opacity: 0.95;
		}
		67% {
			opacity: 0.78;
		}
		82% {
			opacity: 0.9;
		}
	}
	.grain {
		position: absolute;
		inset: -50%;
		pointer-events: none;
		opacity: 0.12;
		background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
		animation: grain 0.8s steps(4) infinite;
	}
	@keyframes grain {
		25% {
			transform: translate(-3%, 2%);
		}
		50% {
			transform: translate(2%, -3%);
		}
		75% {
			transform: translate(-2%, -1%);
		}
	}
	.vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(100% 80% at 50% 40%, transparent 55%, rgba(4, 8, 16, 0.65) 100%);
	}
	figcaption {
		margin-top: 14px;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--parchment-2);
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
	}
	@media (prefers-reduced-motion: reduce) {
		.captain,
		.photo {
			transform: none;
		}
		.photo,
		.fog,
		.lantern,
		.grain {
			animation: none;
		}
	}
	@media (max-width: 900px) {
		.captain {
			width: min(360px, 100%);
			margin-top: 28px;
		}
	}
</style>
