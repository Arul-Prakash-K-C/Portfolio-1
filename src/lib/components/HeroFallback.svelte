<!--
  Static illustration of the same scene. Shown immediately while the
  3D scene loads, and permanently when WebGL is unavailable or the visitor
  chooses not to load it. Decorative: the hero text carries the meaning.
-->
<svg
	class="fallback"
	viewBox="0 0 1600 900"
	preserveAspectRatio="xMidYMid slice"
	aria-hidden="true"
	focusable="false"
>
	<defs>
		<linearGradient id="fb-sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#02050c" />
			<stop offset="0.55" stop-color="#0a1830" />
			<stop offset="0.66" stop-color="#0b1628" />
		</linearGradient>
		<linearGradient id="fb-sea" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#0b1628" />
			<stop offset="1" stop-color="#040913" />
		</linearGradient>
		<radialGradient id="fb-moon" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="#f4e9cf" stop-opacity="0.55" />
			<stop offset="1" stop-color="#f4e9cf" stop-opacity="0" />
		</radialGradient>
		<linearGradient id="fb-glitter" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#f3e6c6" stop-opacity="0.5" />
			<stop offset="1" stop-color="#f3e6c6" stop-opacity="0" />
		</linearGradient>
	</defs>
	<rect width="1600" height="900" fill="url(#fb-sky)" />
	<g fill="#efe4cc">
		{#each Array.from({ length: 90 }, (_, i) => i) as i}
			<circle
				cx={(i * 397) % 1600}
				cy={(i * 211) % 520}
				r={i % 7 === 0 ? 1.8 : 1}
				opacity={0.25 + ((i * 37) % 60) / 100}
			/>
		{/each}
	</g>
	<circle cx="430" cy="210" r="150" fill="url(#fb-moon)" />
	<circle cx="430" cy="210" r="42" fill="#f4e9cf" />
	<!-- islands -->
	<path d="M120 590 L230 520 L330 590 Z M1040 590 L1180 500 L1330 590 Z M1360 590 L1420 555 L1480 590 Z" fill="#08111f" />
	<rect y="588" width="1600" height="312" fill="url(#fb-sea)" />
	<path d="M400 592 L460 592 L520 900 L340 900 Z" fill="url(#fb-glitter)" opacity="0.6" />
	<g stroke="#5ad6c9" stroke-opacity="0.18" fill="none">
		<path d="M0 640 Q200 630 400 640 T800 640 T1200 640 T1600 640" />
		<path d="M0 700 Q200 688 400 700 T800 700 T1200 700 T1600 700" />
		<path d="M0 780 Q200 765 400 780 T800 780 T1200 780 T1600 780" />
	</g>
	<!-- ship silhouette -->
	<g transform="translate(1010 330)">
		<path d="M-10 270 Q150 300 380 268 L420 232 L-40 236 Z" fill="#22150d" />
		<rect x="-6" y="226" width="400" height="8" fill="#d9a84e" opacity="0.8" />
		<rect x="140" y="20" width="7" height="215" fill="#22150d" />
		<rect x="270" y="0" width="7" height="235" fill="#22150d" />
		<path d="M90 50 Q143 64 200 50 L196 140 Q143 152 92 140 Z" fill="#e8dcc0" opacity="0.92" />
		<path d="M96 150 Q143 162 192 150 L190 212 Q143 222 98 212 Z" fill="#e8dcc0" opacity="0.85" />
		<path d="M220 30 Q273 44 330 30 L326 124 Q273 136 222 124 Z" fill="#e8dcc0" opacity="0.92" />
		<path d="M226 134 Q273 146 322 134 L320 206 Q273 216 228 206 Z" fill="#e8dcc0" opacity="0.85" />
		<path d="M283 12 L410 214 L283 214 Z" fill="#e8dcc0" opacity="0.6" />
		<rect x="-30" y="196" width="70" height="40" fill="#3a2618" />
		<circle cx="-34" cy="190" r="6" fill="#ffc46b" />
		<!-- robot crew member -->
		<g transform="translate(70 168)">
			<rect x="-14" y="22" width="28" height="36" rx="6" fill="#8d97a6" />
			<rect x="-20" y="-6" width="40" height="28" rx="5" fill="#8d97a6" />
			<rect x="-15" y="0" width="30" height="14" rx="2" fill="#04151a" />
			<rect x="-11" y="5" width="16" height="3" fill="#5ad6c9" />
			<circle cx="20" cy="2" r="4" fill="#5ad6c9" />
			<path d="M-26 -8 L26 -8 L0 -20 Z" fill="#1b2230" />
		</g>
	</g>
</svg>

<style>
	.fallback {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	/* portrait: keep the ship in view, in the top part of the hero above the text */
	@media (max-width: 860px) and (orientation: portrait) {
		.fallback {
			inset: auto;
			top: 0;
			left: 50%;
			height: 60svh;
			width: auto;
			aspect-ratio: 16 / 9;
			transform: translateX(-74%);
		}
	}
</style>
