<script>
	import { onMount } from 'svelte';

	let host;
	let canvas;
	let active = $state(false);
	let fractured = $state(false);
	let ready = $state(false);

	onMount(() => {
		const section = host.closest('#about');
		const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
		const reducedMotion = reducedQuery.matches;
		let scene = null;
		let playedShot = false;
		let shotTimer = 0;
		let pageVisible = document.visibilityState === 'visible';

		async function loadScene() {
			try {
				const { createAboutScene } = await import('$lib/scene/aboutScene.js');
				scene = createAboutScene(canvas, { reducedMotion });
				ready = true;
				if (active && pageVisible) scene.start();
			} catch (error) {
				console.warn('The cinematic captain scene could not start.', error);
			}
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				active = entry.isIntersecting && entry.intersectionRatio > 0.08;
				if (active) {
					if (!playedShot) {
						playedShot = true;
						if (reducedMotion) fractured = true;
						else shotTimer = window.setTimeout(() => (fractured = true), 1850);
					}
					if (pageVisible) scene?.start();
				} else {
					scene?.stop();
				}
			},
			{ threshold: [0, 0.08, 0.35] }
		);
		if (section) observer.observe(section);

		const resizeObserver = new ResizeObserver(() => scene?.resize());
		resizeObserver.observe(host);
		const onVisibility = () => {
			pageVisible = document.visibilityState === 'visible';
			if (pageVisible && active) scene?.start();
			else scene?.stop();
		};
		document.addEventListener('visibilitychange', onVisibility);
		loadScene();

		return () => {
			observer.disconnect();
			resizeObserver.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			window.clearTimeout(shotTimer);
			scene?.dispose();
		};
	});
</script>

<div class="about-scene" class:active class:ready bind:this={host} aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
	<div class="glass" class:fractured>
		<svg viewBox="0 0 1600 900" preserveAspectRatio="none" role="presentation">
			<defs>
				<linearGradient id="crack-edge" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stop-color="#d5f5ff" stop-opacity="0.9" />
					<stop offset="0.46" stop-color="#87b6c5" stop-opacity="0.48" />
					<stop offset="1" stop-color="#e5c988" stop-opacity="0.26" />
				</linearGradient>
				<linearGradient id="shard-sheen" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stop-color="#e7fbff" stop-opacity="0.16" />
					<stop offset="0.5" stop-color="#8eb7c9" stop-opacity="0.035" />
					<stop offset="1" stop-color="#e3c889" stop-opacity="0.13" />
				</linearGradient>
				<filter id="crack-glow" x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur stdDeviation="1.2" result="blur" />
					<feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
				</filter>
			</defs>
			<g class="shards" fill="url(#shard-sheen)" stroke="url(#crack-edge)" stroke-width="1.1">
				<path d="M426 432 303 320 346 400 421 444Z" />
				<path d="M426 432 357 492 411 468 440 439Z" />
				<path d="M426 432 450 282 462 397 444 433Z" />
				<path d="M426 432 590 376 473 441 439 445Z" />
				<path d="M426 432 552 546 466 476 437 445Z" />
				<path d="M426 432 390 620 406 484 419 449Z" />
				<path d="M426 432 246 462 390 436 414 428Z" />
				<path d="M426 432 273 220 398 391 419 419Z" />
			</g>
			<g class="cracks" fill="none" stroke="url(#crack-edge)" stroke-linecap="round" stroke-linejoin="round" filter="url(#crack-glow)">
				<path stroke-width="1.7" d="M426 432 360 369 333 359 308 324 280 310 262 280" />
				<path stroke-width="1.2" d="M360 369 368 339 349 315 M333 359 317 380 294 385" />
				<path stroke-width="1.6" d="M426 432 442 354 437 315 454 278 450 245" />
				<path stroke-width="1.1" d="M442 354 466 337 481 304 M437 315 415 292 410 262" />
				<path stroke-width="1.8" d="M426 432 514 403 548 380 591 376 628 355" />
				<path stroke-width="1.15" d="M514 403 530 426 563 436 M548 380 555 352 582 336" />
				<path stroke-width="1.7" d="M426 432 504 494 531 528 567 545 599 574" />
				<path stroke-width="1.05" d="M504 494 498 524 518 553 M531 528 557 516 585 525" />
				<path stroke-width="1.6" d="M426 432 415 511 399 551 394 595 376 634" />
				<path stroke-width="1.1" d="M415 511 438 531 441 562 M399 551 372 561 356 590" />
				<path stroke-width="1.8" d="M426 432 342 445 306 456 267 458 230 478" />
				<path stroke-width="1.1" d="M342 445 331 420 302 406 M306 456 290 481 260 488" />
				<path stroke-width="1.4" d="M426 432 369 405 354 382 326 366 310 342" />
				<path stroke-width="1.2" d="M426 432 471 417 496 399 520 396" />
				<path stroke-width="1.1" d="M426 432 451 461 468 475 479 503" />
			</g>
			<circle class="impact-ring" cx="426" cy="432" r="12" fill="none" stroke="#f2fbff" stroke-width="1.5" />
			<circle cx="426" cy="432" r="3" fill="#fff4cf" />
		</svg>
	</div>
</div>

<style>
	.about-scene {
		position: fixed;
		inset: 0;
		z-index: 1;
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
		transition: opacity 680ms ease, visibility 680ms;
	}
	.about-scene.active { visibility: visible; opacity: 1; }
	canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
	.glass { position: absolute; inset: 0; opacity: 0; transition: opacity 260ms ease; }
	.glass.fractured { opacity: 1; }
	.glass svg { display: block; width: 100%; height: 100%; overflow: visible; }
	.shards, .cracks { transform-box: fill-box; transform-origin: 27% 48%; }
	.shards { opacity: 0; }
	.fractured .shards { opacity: 0.8; animation: glass-hit 560ms cubic-bezier(.18,.85,.3,1) both; }
	.cracks { opacity: 0; }
	.fractured .cracks { opacity: 0.82; animation: crack-hit 420ms ease-out both; }
	.impact-ring { opacity: 0; transform-box: fill-box; transform-origin: center; }
	.fractured .impact-ring { animation: impact-pulse 700ms ease-out both; }
	@keyframes glass-hit { from { transform: scale(.78); opacity: 0; } to { transform: scale(1); opacity: .8; } }
	@keyframes crack-hit { from { transform: scale(.94); opacity: 0; } to { transform: scale(1); opacity: .82; } }
	@keyframes impact-pulse { 0% { transform: scale(.1); opacity: .9; } 100% { transform: scale(5); opacity: 0; } }
	@media (max-width: 760px) {
		.glass { opacity: 0; }
		.glass.fractured { opacity: .42; }
		.cracks, .shards { opacity: .56; }
	}
	@media (prefers-reduced-motion: reduce) {
		.about-scene, .glass, .shards, .cracks, .impact-ring { animation: none !important; transition: none !important; }
		.glass.fractured .shards, .glass.fractured .cracks { opacity: .7; }
	}
</style>
