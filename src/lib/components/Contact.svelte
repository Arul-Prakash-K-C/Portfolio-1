<script>
	import { profile } from '$lib/data/profile.js';
	import { reveal } from '$lib/actions.js';

	let copied = $state('');
	/** @param {string} text @param {string} what */
	async function copy(text, what) {
		try {
			await navigator.clipboard.writeText(text);
			copied = `${what} copied to clipboard`;
		} catch {
			copied = `Couldn’t copy automatically; select the ${what.toLowerCase()} and copy it.`;
		}
		setTimeout(() => (copied = ''), 3500);
	}
	const tel = profile.phone.replace(/[^+\d]/g, '');
</script>

<section id="contact" class="section contact" aria-labelledby="contact-title">
	<div class="container inner">
		<header class="section-head reveal" use:reveal>
			<p class="eyebrow">Log 05 · Send a signal</p>
			<h2 id="contact-title" class="section-title">Contact</h2>
			<p class="section-lede">
				Open to full-stack roles, internships and freelance builds. The fastest way to reach Arul is below.
			</p>
		</header>

		<ul class="signals reveal" use:reveal>
			{#if profile.email}
				<li class="signal">
					<span class="kind">Email</span>
					<a class="value" href={'mailto:' + profile.email}>{profile.email}</a>
					<div class="acts">
						<a class="btn btn-primary btn-sm" href={'mailto:' + profile.email}>Write an email</a>
						<button class="btn btn-sm" type="button" onclick={() => copy(profile.email, 'Email address')}>Copy</button>
					</div>
				</li>
			{/if}
			{#if profile.phone}
				<li class="signal">
					<span class="kind">Phone</span>
					<a class="value" href={'tel:' + tel}>{profile.phone}</a>
					<div class="acts">
						<a class="btn btn-sm" href={'tel:' + tel}>Call</a>
						<button class="btn btn-sm" type="button" onclick={() => copy(profile.phone, 'Phone number')}>Copy</button>
					</div>
				</li>
			{/if}
			{#each profile.socials as s}
				<li class="signal">
					<span class="kind">{s.label}</span>
					<a class="value" href={s.href} target="_blank" rel="noopener">@{s.handle}<span class="sr-only"> (opens in a new tab)</span></a>
					<div class="acts">
						<a class="btn btn-sm" href={s.href} target="_blank" rel="noopener">Open profile ↗<span class="sr-only"> on {s.label}</span></a>
					</div>
				</li>
			{/each}
			{#if profile.resumeUrl}
				<li class="signal">
					<span class="kind">Résumé</span>
					<a class="value" href={profile.resumeUrl} target="_blank" rel="noopener">resume.pdf</a>
					<div class="acts">
						<a class="btn btn-sm" href={profile.resumeUrl} target="_blank" rel="noopener">View PDF ↗</a>
					</div>
				</li>
			{/if}
		</ul>
		<p class="toast" role="status" aria-live="polite">{copied}</p>
	</div>
</section>

<style>
	.contact {
		background:
			radial-gradient(60% 70% at 50% 100%, rgba(217, 168, 78, 0.1), transparent 70%),
			linear-gradient(180deg, #06121a, var(--ink));
		border-top: 1px solid var(--line);
	}
	.inner {
		max-width: 860px;
	}
	.signals {
		list-style: none;
		display: grid;
		gap: 12px;
	}
	.signal {
		display: grid;
		grid-template-columns: 110px 1fr auto;
		align-items: center;
		gap: 16px;
		padding: 18px 20px;
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: rgba(10, 20, 36, 0.6);
		transition: border-color var(--t-fast);
	}
	.signal:hover,
	.signal:focus-within {
		border-color: var(--brass);
	}
	.kind {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--teal);
	}
	.value {
		font-size: 1.12rem;
		color: var(--parchment);
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.value:hover {
		color: var(--brass-2);
		text-decoration: underline;
	}
	.acts {
		display: flex;
		gap: 8px;
	}
	.toast {
		min-height: 1.6em;
		margin-top: 14px;
		color: var(--teal);
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}
	@media (max-width: 640px) {
		.signal {
			grid-template-columns: 1fr;
			gap: 8px;
		}
	}
</style>
