<script>
	import Nav from '$lib/components/Nav.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Projects from '$lib/components/Projects.svelte';
	import About from '$lib/components/About.svelte';
	import Skills from '$lib/components/Skills.svelte';
	import Experience from '$lib/components/Experience.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import RobotGuide from '$lib/components/RobotGuide.svelte';
	import SceneHost from '$lib/components/SceneHost.svelte';
	import { profile } from '$lib/data/profile.js';

	const title = `${profile.name} | ${profile.role}`;
	const description =
		'Portfolio of Arul Prakash K C, a full-stack developer and MCA student at Sona College of Technology. Projects built with SvelteKit, React, Node.js, Firebase and Supabase.';
	// Set this to the deployed URL so social previews get absolute links.
	const siteUrl = '';
	const image = (siteUrl || '') + '/og.png';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content={profile.name} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:image:alt" content="A moonlit ship at sea with a robot crew member, beside the name Arul Prakash K C." />
	{#if siteUrl}<meta property="og:url" content={siteUrl} /><link rel="canonical" href={siteUrl} />{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: profile.name,
		jobTitle: profile.role,
		alumniOf: 'Sona College of Technology',
		sameAs: profile.socials.map((s) => s.href)
	})}</script>`}
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>
<SceneHost />
<Nav />
<main id="main" tabindex="-1">
	<Hero />
	<About />
	<Skills />
	<Projects />
	<Experience />
	<Contact />
</main>
<Footer />
<RobotGuide />
