/**
 * Adds `.is-in` once the element scrolls into view. Content stays visible
 * without JS (the hidden state only applies under `.js`).
 * @param {HTMLElement} node
 */
export function reveal(node) {
	if (typeof IntersectionObserver === 'undefined') {
		node.classList.add('is-in');
		return {};
	}
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (e.isIntersecting) {
					node.classList.add('is-in');
					io.disconnect();
				}
			}
		},
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}

/** Shared media-query helper. */
export function prefersReducedMotion() {
	return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
