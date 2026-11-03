<script>
	import { profile } from '$lib/data/profile.js';
	const year = new Date().getFullYear();
	const links = ['Home', 'About', 'Skills', 'Projects', 'Experience', 'Contact'];
</script>

<footer class="footer">
	<div class="container row">
		<div>
			<p class="name">{profile.name}</p>
			<p class="role">{profile.role} · {profile.location}</p>
		</div>
		<nav aria-label="Footer">
			<ul>
				{#each links as l}<li><a href={'#' + l.toLowerCase()}>{l}</a></li>{/each}
				{#each profile.socials as s}
					<li><a href={s.href} target="_blank" rel="noopener">{s.label} ↗<span class="sr-only"> (opens in a new tab)</span></a></li>
				{/each}
			</ul>
		</nav>
	</div>
	<div class="container base">
		<p>© {year} {profile.name}. Scene, ship and robot are original, generated in code.</p>
		<a href="#home">Back to the start of the voyage ↑</a>
	</div>
</footer>

<style>
	.footer {
		background: var(--ink);
		border-top: 1px solid var(--line);
		padding: 40px 0 28px;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 24px;
	}
	.name {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.15rem;
	}
	.role {
		color: var(--muted);
		font-size: 0.9rem;
	}
	ul {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 6px;
	}
	a {
		display: inline-flex;
		align-items: center;
		min-height: 40px;
		padding: 4px 8px;
		color: var(--parchment-2);
		text-decoration: none;
		font-size: 0.92rem;
	}
	a:hover {
		color: var(--brass-2);
		text-decoration: underline;
	}
	.base {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		margin-top: 24px;
		padding-top: 18px;
		border-top: 1px solid var(--line);
		color: var(--muted);
		font-size: 0.84rem;
	}
</style>
