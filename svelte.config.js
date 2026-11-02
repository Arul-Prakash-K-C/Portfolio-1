import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// No options on purpose: on Vercel/Netlify adapter-static switches to
		// zero-config mode and writes the platform's output format; locally it writes ./build.
		adapter: adapter(),
		prerender: { handleHttpError: 'fail' }
	}
};

export default config;
