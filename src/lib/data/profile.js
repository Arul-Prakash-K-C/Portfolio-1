/**
 * Personal details shown on the site.
 *
 * SOURCES (keep this honest — every value below must be backed by one):
 *  - [R] Résumé facts as summarised in the portfolio brief (resume PDF itself not yet supplied).
 *  - [P] Arul's previous portfolio: github.com/Arul-Prakash-K-C/Portfolio (index.html).
 *  - [G] GitHub account that owns this repository and the project repos.
 *
 * Empty strings / empty arrays are intentionally hidden by the UI —
 * fill them in from the résumé and the matching button, link or section appears.
 */
export const profile = {
	name: 'Arul Prakash K C',
	shortName: 'Arul',
	role: 'Full-Stack Developer',
	location: 'Salem, Tamil Nadu, India', // [P]
	// One line, built only from verified facts.
	tagline:
		'MCA student at Sona College of Technology building full-stack web apps with SvelteKit, React, Node.js and Firebase, from database rules to the interface.',

	// Contact — NOT in any supplied file yet. Add from the résumé.
	email: '', // e.g. 'name@example.com'
	phone: '', // e.g. '+91 90000 00000'

	// Supplied by Arul (Nov 2026). Set to null to hide the portrait.
	portrait: {
		src: '/portrait/arul.webp',
		srcSmall: '/portrait/arul-320.webp',
		alt: 'Arul Prakash K C in a navy blazer and white shirt, smiling, under the trees on campus.'
	},

	// Pirate-captain portrait for the About stage (generated from Arul's own photo).
	// Save it as static/portrait/captain.webp (+ captain-640.webp) and fill this in, e.g.
	// { src: '/portrait/captain.webp', srcSmall: '/portrait/captain-640.webp',
	//   alt: 'Arul Prakash K C as a sea captain in a navy greatcoat on a moonlit deck.',
	//   caption: 'Captain of the Night Compiler' }
	captainPortrait: null,

	// Put the résumé at static/resume.pdf and set this to '/resume.pdf'.
	resumeUrl: '',

	socials: [
		{ label: 'GitHub', href: 'https://github.com/Arul-Prakash-K-C', handle: 'Arul-Prakash-K-C' } // [G]
		// { label: 'LinkedIn', href: '', handle: '' },  // add once the real URL is confirmed
	]
};

export const about = [
	'I am an MCA student at Sona College of Technology in Salem, and I build full-stack web applications. Most of my recent work is in SvelteKit, backed by Firebase or Supabase, and deployed on Vercel.',
	'My projects tend to start from a real, messy process: capstone teams formed by chance, government services spread across separate portals, farmers selling through middlemen, scam messages that are risky to check. I try to replace them with one clear, role-based system, with security handled in the database rules as well as the interface.'
];

/** Education — dates from Arul's previous portfolio [P]; verify against the résumé. */
export const education = [
	{
		title: 'Master of Computer Applications (MCA)',
		org: 'Sona College of Technology (Autonomous), Salem',
		period: '2025 – 2027',
		note: 'Course projects include Project-Sync (Advanced Web Programming) and SafeScan (Mini Project).'
	},
	{
		title: 'B.Sc. Computer Science',
		org: 'Government Arts College (Autonomous), Salem',
		period: '2021 – 2024',
		note: ''
	}
];

/** Experience [R]. Responsibilities are left empty until supplied from the résumé. */
export const experience = [
	{
		title: 'Full-Stack Application Development Intern',
		org: 'SymphoZen Labs',
		period: 'From August 2026',
		points: []
	}
];

/** Certifications — none supplied yet. Section is hidden while this is empty. */
export const certifications = [
	// { name: '', issuer: '', date: '', url: '' }
];

/**
 * Skills. `resume` groups come from the résumé list [R].
 * `usedIn` lists the projects in this portfolio where the tool actually appears in the code or report.
 */
export const skillGroups = [
	{
		id: 'languages',
		label: 'Languages',
		system: 'Rigging',
		skills: [
			{ name: 'JavaScript', usedIn: ['tn-kuviyam', 'agri-sphere', 'vazhi', 'hexoria'] },
			{ name: 'Java', usedIn: [] },
			{ name: 'Python', usedIn: ['safescan'] },
			{ name: 'SQL', usedIn: ['project-sync', 'hexoria'] }
		]
	},
	{
		id: 'frontend',
		label: 'Front-end',
		system: 'Sails',
		skills: [
			{ name: 'SvelteKit', usedIn: ['project-sync', 'tn-kuviyam', 'agri-sphere', 'vazhi', 'safescan'] },
			{ name: 'React', usedIn: ['hexoria', 'turf-booking'] },
			{ name: 'Tailwind CSS', usedIn: ['project-sync', 'tn-kuviyam', 'agri-sphere'] }
		]
	},
	{
		id: 'backend',
		label: 'Back-end',
		system: 'Engine room',
		skills: [
			{ name: 'Node.js', usedIn: ['hexoria', 'turf-booking', 'agri-sphere'] },
			{ name: 'Express', usedIn: ['hexoria', 'turf-booking'] }
		]
	},
	{
		id: 'data',
		label: 'Databases & services',
		system: 'Cargo hold',
		skills: [
			{ name: 'Firebase', usedIn: ['tn-kuviyam', 'agri-sphere', 'vazhi'] },
			{ name: 'MongoDB', usedIn: ['turf-booking'] },
			{ name: 'MySQL', usedIn: [] }
		]
	}
];

/** Tools seen in the project code and reports (not from the résumé list). */
export const projectTools = [
	'TypeScript',
	'Svelte 5',
	'Supabase',
	'PostgreSQL',
	'FastAPI',
	'XGBoost',
	'Tesseract OCR',
	'Gemini API',
	'Three.js',
	'AWS S3',
	'JWT auth',
	'Vitest',
	'GitHub Actions',
	'Vercel'
];
