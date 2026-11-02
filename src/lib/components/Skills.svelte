<script>
	import { skillGroups, projectTools } from '$lib/data/profile.js';
	import { projects } from '$lib/data/projects.js';
	import { reveal } from '$lib/actions.js';

	const names = Object.fromEntries(projects.map((p) => [p.id, p.title]));
	names['turf-booking'] = 'Turf Booking';

	let activeGroup = $state(skillGroups[0].id);
</script>

<section id="skills" class="section skills" aria-labelledby="skills-title">
	<div class="grid-bg" aria-hidden="true"></div>
	<div class="container">
		<header class="section-head reveal" use:reveal>
			<p class="eyebrow">Log 03 · Engineering console</p>
			<h2 id="skills-title" class="section-title">Skills: ship systems</h2>
			<p class="section-lede">
				The tools listed on Arul’s résumé, grouped by system. There are no ratings or percentages; each one
				shows the projects in this log that actually use it.
			</p>
		</header>

		<div class="console reveal" use:reveal>
			<div class="console-top" aria-hidden="true">
				<span class="led"></span><span class="led amber"></span><span class="led off"></span>
				<span class="readout">systems.status — all hands on deck</span>
			</div>

			<div class="tabs" role="tablist" aria-label="Skill systems">
				{#each skillGroups as g}
					<button
						role="tab"
						type="button"
						id={'tab-' + g.id}
						aria-selected={activeGroup === g.id}
						aria-controls={'panel-' + g.id}
						tabindex={activeGroup === g.id ? 0 : -1}
						onclick={() => (activeGroup = g.id)}
						onkeydown={(e) => {
							const i = skillGroups.findIndex((x) => x.id === activeGroup);
							let n = -1;
							if (e.key === 'ArrowRight') n = (i + 1) % skillGroups.length;
							if (e.key === 'ArrowLeft') n = (i - 1 + skillGroups.length) % skillGroups.length;
							if (e.key === 'Home') n = 0;
							if (e.key === 'End') n = skillGroups.length - 1;
							if (n >= 0) {
								e.preventDefault();
								activeGroup = skillGroups[n].id;
								document.getElementById('tab-' + skillGroups[n].id)?.focus();
							}
						}}
					>
						<span class="sys">{g.system}</span>
						<span class="lbl">{g.label}</span>
					</button>
				{/each}
			</div>

			{#each skillGroups as g}
				<div
					class="panel"
					role="tabpanel"
					id={'panel-' + g.id}
					aria-labelledby={'tab-' + g.id}
					hidden={activeGroup !== g.id}
					tabindex="0"
				>
					<ul class="rows">
						{#each g.skills as s}
							<li class="row">
								<span class="name">{s.name}</span>
								<span class="used">
									{#if s.usedIn.length}
										<span class="used-lbl">Used in</span>
										{s.usedIn.map((id) => names[id] ?? id).join(', ')}
									{:else}
										<span class="used-lbl">Listed on résumé</span> no project in this log uses it yet
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<div class="extra reveal" use:reveal>
			<h3>Also used in project work</h3>
			<p>Seen in the source code or reports of the projects above.</p>
			<ul class="chips">
				{#each projectTools as t}<li class="chip chip-teal">{t}</li>{/each}
			</ul>
		</div>
	</div>
</section>

<style>
	.skills {
		background: linear-gradient(180deg, var(--navy), #071419 55%, #06121a);
		overflow: hidden;
	}
	.grid-bg {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(90, 214, 201, 0.06) 1px, transparent 1px),
			linear-gradient(90deg, rgba(90, 214, 201, 0.06) 1px, transparent 1px);
		background-size: 44px 44px;
		mask-image: radial-gradient(70% 60% at 50% 40%, #000, transparent);
		pointer-events: none;
	}
	.container {
		position: relative;
	}
	.console {
		border-radius: 18px;
		border: 1px solid rgba(90, 214, 201, 0.28);
		background: linear-gradient(180deg, rgba(8, 26, 32, 0.92), rgba(6, 16, 24, 0.95));
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.4) inset,
			0 30px 80px rgba(0, 0, 0, 0.4),
			0 0 60px rgba(90, 214, 201, 0.06);
		overflow: hidden;
	}
	.console-top {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 18px;
		border-bottom: 1px solid rgba(90, 214, 201, 0.18);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: #8fded5;
	}
	.led {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--teal);
		box-shadow: 0 0 8px var(--teal);
	}
	.led.amber {
		background: var(--brass);
		box-shadow: 0 0 8px var(--brass);
	}
	.led.off {
		background: #2b3a40;
		box-shadow: none;
	}
	.readout {
		margin-left: 8px;
	}
	.tabs {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		border-bottom: 1px solid rgba(90, 214, 201, 0.18);
	}
	[role='tab'] {
		display: grid;
		gap: 2px;
		text-align: left;
		padding: 16px 18px;
		min-height: 64px;
		border: 0;
		border-right: 1px solid rgba(90, 214, 201, 0.12);
		background: transparent;
		cursor: pointer;
		transition: background var(--t-fast);
	}
	[role='tab']:last-child {
		border-right: 0;
	}
	[role='tab']:hover {
		background: rgba(90, 214, 201, 0.05);
	}
	[role='tab'][aria-selected='true'] {
		background: rgba(90, 214, 201, 0.1);
		box-shadow: inset 0 -2px 0 var(--teal);
	}
	.sys {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--teal);
	}
	.lbl {
		font-weight: 600;
		color: var(--parchment);
	}
	.panel {
		padding: 10px 18px 18px;
	}
	.panel:focus-visible {
		outline-offset: -4px;
	}
	.rows {
		list-style: none;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(130px, 220px) 1fr;
		gap: 16px;
		align-items: baseline;
		padding: 14px 0;
		border-bottom: 1px dashed rgba(90, 214, 201, 0.16);
		animation: scan 0.5s var(--ease-out) both;
	}
	.row:last-child {
		border-bottom: 0;
	}
	@keyframes scan {
		from {
			opacity: 0;
			transform: translateX(-8px);
		}
	}
	.name {
		font-family: var(--font-mono);
		font-size: 1.02rem;
		color: #d6fbf6;
	}
	.name::before {
		content: '▸ ';
		color: var(--brass);
	}
	.used {
		color: var(--parchment-2);
		font-size: 0.95rem;
	}
	.used-lbl {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
		margin-right: 8px;
	}
	.extra {
		margin-top: 36px;
	}
	.extra h3 {
		font-size: 1.2rem;
	}
	.extra p {
		color: var(--muted);
		margin: 4px 0 14px;
	}
	@media (max-width: 760px) {
		.tabs {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		[role='tab']:nth-child(2) {
			border-right: 0;
		}
		[role='tab']:nth-child(-n + 2) {
			border-bottom: 1px solid rgba(90, 214, 201, 0.12);
		}
		.row {
			grid-template-columns: 1fr;
			gap: 4px;
		}
	}
</style>
