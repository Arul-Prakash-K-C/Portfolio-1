/**
 * A tiny bridge between the HTML sections and the 3D scene.
 * Sections publish what is in focus (the active skill tab, the project card
 * in view); the scene host forwards it. Nothing depends on the scene being
 * present: if WebGL is off, these calls simply have no listener.
 */
/** @type {Set<(f: Record<string, number>) => void>} */
const listeners = new Set();
/** @type {Record<string, number>} */
const state = { skill: 0, project: -1, projectsFrac: 0 };

/** @param {Record<string, number>} patch */
export function setFocus(patch) {
	Object.assign(state, patch);
	for (const fn of listeners) fn(state);
}

/** @param {(f: Record<string, number>) => void} fn */
export function onFocus(fn) {
	listeners.add(fn);
	fn(state);
	return () => listeners.delete(fn);
}
