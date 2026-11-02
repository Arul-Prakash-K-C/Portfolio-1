<script>
	import '@fontsource/cinzel/600.css';
	import '@fontsource/cinzel/700.css';
	import '@fontsource-variable/inter';
	import '@fontsource/jetbrains-mono/400.css';
	import '@fontsource/jetbrains-mono/500.css';
	import '../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		document.documentElement.classList.add('js');
	});
</script>

{@render children()}
