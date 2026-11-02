<script>
	import { onMount } from 'svelte';
	import { profile } from '$lib/data/profile.js';

	const links = [
		{ id: 'home', label: 'Home' },
		{ id: 'projects', label: 'Projects' },
		{ id: 'about', label: 'About' },
		{ id: 'skills', label: 'Skills' },
		{ id: 'experience', label: 'Experience' },
		{ id: 'contact', label: 'Contact' }
	];

	let open = $state(false);
	let active = $state('home');
	let scrolled = $state(false);
	let progress = $state(0);
	/** @type {HTMLButtonElement} */
	let toggle;

	function close(focusToggle = false) {
		open = false;
		if (focusToggle) toggle?.focus();
	}

	onMount(() => {
		const sections = links.map((l) => document.getElementById(l.id)).filter(Boolean);
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) active = e.target.id;
			},
			{ rootMargin: '-45% 0px -50% 0px' }
		);
		sections.forEach((s) => io.observe(/** @type {Element} */ (s)));

		const onScroll = () => {
			scrolled = window.scrollY > 24;
			const max = document.documentElement.scrollHeight - window.innerHeight;
			progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });

		const onKey = (/** @type {KeyboardEvent} */ e) => {
			if (e.key === 'Escape' && open) close(true);
		};
		window.addEventListener('keydown', onKey);
		const mq = matchMedia('(min-width: 900px)');
		const onMq = () => mq.matches && close();
		mq.addEventListener('change', onMq);

		return () => {
			io.disconnect();
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('keydown', onKey);
			mq.removeEventListener('change', onMq);
		};
	});
</script>

<header class="nav" class:scrolled class:open>
	<div class="bar container">
		<a class="brand" href="#home" onclick={() => close()}>
			<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
				<circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" stroke-width="1.6" />
				<path d="M16 4 L18.4 16 L16 28 L13.6 16 Z" fill="#efe4cc" />
				<circle cx="16" cy="16" r="2.6" fill="#5ad6c9" />
			</svg>
			<span>Arul Prakash <span class="kc">K C</span></span>
		</a>

		<nav aria-label="Primary">
			<button
				bind:this={toggle}
				class="menu-btn"
				type="button"
				aria-expanded={open}
				aria-controls="primary-links"
				onclick={() => (open = !open)}
			>
				<span class="bars" aria-hidden="true"><span></span><span></span><span></span></span>
				<span class="menu-label">{open ? 'Close' : 'Menu'}</span>
				<span class="sr-only">{open ? 'Close navigation menu' : 'Open navigation menu'}</span>
			</button>

			<ul id="primary-links" class="links">
				{#each links as l}
					<li>
						<a
							href={'#' + l.id}
							aria-current={active === l.id ? 'true' : undefined}
							onclick={() => close()}>{l.label}</a
						>
					</li>
				{/each}
				{#if profile.resumeUrl}
					<li class="resume-li">
						<a class="btn btn-primary btn-sm" href={profile.resumeUrl} target="_blank" rel="noopener">
							View Resume <span class="sr-only">(PDF, opens in a new tab)</span>
						</a>
					</li>
				{/if}
			</ul>
		</nav>
	</div>
	<div class="progress" aria-hidden="true" style:transform={`scaleX(${progress})`}></div>
</header>

<style>
	.nav {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 100;
		height: var(--nav-h);
		transition:
			background var(--t-med),
			border-color var(--t-med);
		border-bottom: 1px solid transparent;
	}
	.nav.scrolled {
		background: rgba(6, 11, 21, 0.86);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border-bottom-color: var(--line);
	}
	/* no backdrop-filter while open: it would make the fixed menu panel position against the header */
	.nav.open {
		background: #060b15;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border-bottom-color: var(--line);
	}
	.bar {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		color: var(--brass-2);
		text-decoration: none;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.02rem;
		letter-spacing: 0.04em;
	}
	.brand span {
		color: var(--parchment);
	}
	.brand .kc {
		color: var(--muted);
	}
	.links {
		display: flex;
		align-items: center;
		gap: 4px;
		list-style: none;
	}
	.links a:not(.btn) {
		display: inline-flex;
		align-items: center;
		min-height: 40px;
		padding: 6px 12px;
		border-radius: 999px;
		color: var(--parchment-2);
		text-decoration: none;
		font-size: 0.92rem;
		font-weight: 500;
		transition:
			color var(--t-fast),
			background var(--t-fast);
	}
	.links a:not(.btn):hover {
		color: var(--parchment);
		background: rgba(239, 228, 204, 0.06);
	}
	.links a[aria-current='true'] {
		color: var(--brass-2);
		background: rgba(217, 168, 78, 0.1);
	}
	.resume-li {
		margin-left: 8px;
	}
	.menu-btn {
		display: none;
		align-items: center;
		gap: 10px;
		min-height: 44px;
		padding: 6px 14px;
		border-radius: 999px;
		border: 1px solid var(--line-strong);
		background: rgba(6, 11, 21, 0.6);
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}
	.bars {
		display: grid;
		gap: 4px;
		width: 18px;
	}
	.bars span {
		height: 2px;
		background: var(--parchment);
		border-radius: 2px;
		transition: transform var(--t-med) var(--ease-out), opacity var(--t-fast);
	}
	.open .bars span:nth-child(1) {
		transform: translateY(6px) rotate(45deg);
	}
	.open .bars span:nth-child(2) {
		opacity: 0;
	}
	.open .bars span:nth-child(3) {
		transform: translateY(-6px) rotate(-45deg);
	}
	.progress {
		position: absolute;
		left: 0;
		right: 0;
		bottom: -1px;
		height: 2px;
		background: linear-gradient(90deg, var(--brass), var(--teal));
		transform-origin: 0 50%;
		transform: scaleX(0);
	}

	@media (max-width: 899px) {
		.menu-btn {
			display: inline-flex;
		}
		.links {
			position: fixed;
			top: var(--nav-h);
			left: 0;
			right: 0;
			flex-direction: column;
			align-items: stretch;
			gap: 2px;
			padding: 12px var(--gutter) 24px;
			background: #060b15;
			max-height: calc(100dvh - var(--nav-h));
			overflow-y: auto;
			border-bottom: 1px solid var(--line);
			visibility: hidden;
			opacity: 0;
			transform: translateY(-8px);
			transition:
				opacity var(--t-med) var(--ease-out),
				transform var(--t-med) var(--ease-out),
				visibility 0s linear var(--t-med);
		}
		.open .links {
			visibility: visible;
			opacity: 1;
			transform: none;
			transition-delay: 0s;
		}
		.links a:not(.btn) {
			min-height: 48px;
			padding: 10px 14px;
			font-size: 1.05rem;
			border-radius: var(--radius-sm);
		}
		.resume-li {
			margin: 10px 0 0;
		}
		.resume-li .btn {
			width: 100%;
		}
	}
</style>
