<!--
  "Bit", the ship's robot engineer. Gives one short, optional tip when a new
  section comes into view, then tucks itself away after a few seconds so it
  never sits on top of content. Not needed for navigation; can be muted.
-->
<script>
	import { onMount } from 'svelte';
	import { profile } from '$lib/data/profile.js';

	const tips = {
		home: 'Ahoy! I’m Bit, ship’s engineer. Arul’s projects are one scroll down. No puzzles, promise.',
		projects: 'Every card opens a mission file: the goal, Arul’s role, the stack and where each detail comes from.',
		about: 'The logbook on the right holds the dates for study and work.',
		skills: 'No made-up percentages here. Each tool lists the projects that actually use it.',
		experience: 'Crew record: the current internship and the course projects behind two of the voyages.',
		contact: profile.email
			? 'Email is the quickest signal. There’s a copy button if you need it.'
			: 'GitHub is the open channel for now. The source for most projects lives there.'
	};

	let tip = $state('');
	let show = $state(false);
	let muted = $state(false);
	/** @type {ReturnType<typeof setTimeout>} */
	let timer;
	const seen = new Set();

	/** @param {string} id */
	function say(id) {
		// the welcome tip is only shown on request, so it never covers the hero text
		if (muted || id === 'home' || seen.has(id) || !(id in tips)) return;
		seen.add(id);
		tip = tips[/** @type {keyof typeof tips} */ (id)];
		show = true;
		clearTimeout(timer);
		timer = setTimeout(() => (show = false), 7000);
	}

	function toggle() {
		if (muted) {
			muted = false;
			try {
				localStorage.removeItem('bit-muted');
			} catch {}
			tip = 'Back on watch. I’ll keep it brief.';
			show = true;
			clearTimeout(timer);
			timer = setTimeout(() => (show = false), 4000);
		} else {
			show = !show;
			if (show && !tip) tip = tips.home;
		}
	}

	function mute() {
		muted = true;
		show = false;
		try {
			localStorage.setItem('bit-muted', '1');
		} catch {}
	}

	onMount(() => {
		try {
			muted = localStorage.getItem('bit-muted') === '1';
		} catch {}
		const small = window.innerWidth < 760;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) say(e.target.id);
			},
			{ rootMargin: '-40% 0px -55% 0px' }
		);
		const start = setTimeout(
			() => {
				for (const id of Object.keys(tips)) {
					const el = document.getElementById(id);
					if (el) io.observe(el);
				}
			},
			small ? 4000 : 1400
		);
		return () => {
			clearTimeout(start);
			clearTimeout(timer);
			io.disconnect();
		};
	});
</script>

<aside class="guide" aria-label="Ship’s robot tips">
	{#if show}
		<div class="bubble" id="bit-bubble">
			<p>{tip}</p>
			<button class="mute" type="button" onclick={mute}>Mute tips</button>
		</div>
	{/if}
	<button
		class="bot"
		type="button"
		onclick={toggle}
		aria-expanded={show}
		aria-controls="bit-bubble"
		aria-label={muted ? 'Turn robot tips back on' : show ? 'Hide robot tip' : 'Show robot tip'}
		class:muted
	>
		<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
			<path d="M10 12 L38 12 L24 4 Z" fill="#1b2230" />
			<rect x="8" y="12" width="32" height="24" rx="6" fill="#8d97a6" />
			<rect x="12" y="17" width="24" height="12" rx="2" fill="#04151a" />
			<rect class="cursor" x="15" y="21" width="10" height="3" fill="#5ad6c9" />
			<circle cx="40" cy="18" r="3" fill="#5ad6c9" />
			<rect x="16" y="36" width="16" height="8" rx="3" fill="#6b7686" />
		</svg>
	</button>
</aside>

<style>
	.guide {
		position: fixed;
		left: 16px;
		bottom: 16px;
		z-index: 90;
		display: flex;
		align-items: flex-end;
		gap: 10px;
		flex-direction: column-reverse;
		align-items: flex-start;
		pointer-events: none;
	}
	.guide > * {
		pointer-events: auto;
	}
	.bot {
		display: grid;
		place-items: center;
		width: 54px;
		height: 54px;
		border-radius: 50%;
		border: 1px solid rgba(90, 214, 201, 0.4);
		background: rgba(6, 11, 21, 0.85);
		backdrop-filter: blur(8px);
		cursor: pointer;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
		transition: transform var(--t-fast) var(--ease-out), border-color var(--t-fast);
	}
	.bot:hover {
		transform: translateY(-2px) rotate(-4deg);
		border-color: var(--teal);
	}
	.bot.muted {
		opacity: 0.55;
	}
	.cursor {
		animation: blink 1.1s steps(2) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	.bubble {
		max-width: min(290px, calc(100vw - 32px));
		padding: 14px 16px 10px;
		border-radius: 14px 14px 14px 4px;
		border: 1px solid rgba(90, 214, 201, 0.35);
		background: rgba(6, 16, 24, 0.95);
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--parchment);
		animation: pop 0.35s var(--ease-out);
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.96);
		}
	}
	.mute {
		margin-top: 6px;
		padding: 6px 0;
		min-height: 32px;
		border: 0;
		background: none;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		text-decoration: underline;
		cursor: pointer;
	}
	.mute:hover {
		color: var(--parchment);
	}
	/* On phones there is no free margin, so the companion stays out of the way entirely. */
	@media print, (max-width: 759px) {
		.guide {
			display: none;
		}
	}
</style>
