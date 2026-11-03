import { experience, education } from './profile.js';

/** Academic project work, from the supplied project reports. */
export const academic = [
	{ title: 'SafeScan', detail: 'P23MCA306 · Mini Project · team of three', period: 'Jul – Oct 2026', sort: 2026.5 },
	{ title: 'Project-Sync', detail: 'P23MCA303 · Advanced Web Programming · team of four', period: 'Oct 2026', sort: 2026.8 }
];

/** first four-digit year in a period string, for ordering the voyage */
const yearOf = (/** @type {string} */ p) => Number((p.match(/\d{4}/) || ['0'])[0]);

/**
 * One chronological voyage: every port of study, course project and crew post,
 * in the order the ship reached it. With the 3D scene on, each one is a lit
 * port the ship sails past while its log card is on screen.
 * @type {{ kind: 'Port of study'|'Course project'|'Crew record', title: string, org: string, period: string, points: string[], sort: number }[]}
 */
export const ports = [
	...education.map((e) => ({ kind: /** @type {const} */ ('Port of study'), title: e.title, org: e.org, period: e.period, points: e.note ? [e.note] : [], sort: yearOf(e.period) })),
	...academic.map((a) => ({ kind: /** @type {const} */ ('Course project'), title: a.title, org: a.detail, period: a.period, points: [], sort: a.sort })),
	...experience.map((e) => ({ kind: /** @type {const} */ ('Crew record'), title: e.title, org: e.org, period: e.period, points: e.points, sort: yearOf(e.period) + 0.6 }))
].sort((a, b) => a.sort - b.sort);
