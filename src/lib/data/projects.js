/**
 * Voyage log — project entries.
 *
 * Every statement here is traceable to one of:
 *  - the project's public source code (routes, package.json, README),
 *  - the project report PDF supplied with the brief,
 *  - the git history (for who committed what).
 * `evidence` records which, and is shown in the case study so readers know where a claim comes from.
 * Nothing here is a guessed feature, metric or outcome.
 */

/** @typedef {{src:string, alt:string}} Shot */

export const projects = [
	{
		id: 'project-sync',
		title: 'Project-Sync',
		kicker: 'Capstone teams, formed on evidence',
		year: '2026',
		status: 'Live',
		summary:
			'A web platform that helps university departments run capstone projects from team formation to final review, with explainable skill matching for students and a team-risk view for mentors.',
		team: 'Team of four · MCA Advanced Web Programming project',
		role: 'Co-developer in a four-person team (with Lawrance William Y, Mohammed Bilal A and Moulishwar G).',
		live: 'https://project-sync-omega.vercel.app/',
		source: 'https://github.com/Arul-Prakash-K-C/Project-Sync',
		shots: [
			{ src: '/projects/project-sync-landing.webp', alt: 'Project-Sync landing page with the headline "Build teams on evidence, not luck."' },
			{ src: '/projects/project-sync-team-finder.webp', alt: 'Team Finder page ranking classmates with 0–100 compatibility scores and skill filters.' },
			{ src: '/projects/project-sync-kanban.webp', alt: 'Project workspace with a four-column Kanban task board.' },
			{ src: '/projects/project-sync-analytics.webp', alt: 'Student analytics page with a team-risk score, burndown chart and task status by team.' }
		],
		problem:
			'Capstone teams are usually formed by friendship or roll number rather than skill, and the work then scatters across chats, spreadsheets, e-mail and paper registers, so mentors notice struggling teams late.',
		users: 'Students, faculty mentors and department administrators.',
		features: [
			'Team Finder that ranks classmates with a 0–100 compatibility score over a skill graph and shows where every point comes from.',
			'Project proposals with required skills, a chosen mentor and a team size of two to eight; the creator becomes Team Leader.',
			'Shared workspace with a drag-and-drop Kanban board (with a keyboard and screen-reader alternative), milestones, files, discussions and weekly reports.',
			'Mentor tools: approvals, milestone deadlines, weekly-report review, review meetings with attendance, and an explainable six-factor team-risk score that lists the riskiest teams first.',
			'Admin tools for accounts, departments and faculty sign-up approval; CSV and PDF reports.'
		],
		architecture:
			'Single-page SvelteKit app on Vercel talking directly to Supabase: Auth, PostgreSQL with Row Level Security on all 17 tables, Realtime for live updates, Storage for files, and an Edge Function for e-mail notifications.',
		stack: ['SvelteKit 2', 'Svelte 5', 'TypeScript', 'Tailwind CSS v4', 'Supabase', 'PostgreSQL', 'Vitest', 'GitHub Actions', 'Vercel'],
		choices: [
			'Security is enforced in the database with Row Level Security, not only in the UI.',
			'Matching and risk scores are local, explainable models with fixed factor ceilings; no external AI service is called.',
			'Passwords hashed with PBKDF2; five failed sign-ins lock the account for 60 seconds.',
			'159 automated tests, including 37 database-security tests that run the real schema on in-process PostgreSQL (PGlite); every push is type-checked, tested and built by GitHub Actions.'
		],
		evidence: 'Project report (Oct 2026), public repository and its commit history.'
	},
	{
		id: 'tn-kuviyam',
		title: 'TN Kuviyam',
		kicker: 'One centre for government services',
		year: '2026',
		status: 'Prototype · Live',
		summary:
			'A prototype portal that brings Tamil Nadu government services into one place: citizens discover, apply for and track services, while department, operator and admin roles process applications.',
		team: 'Solo build: every commit in the repository is from Arul’s account',
		role: 'Designed and built the application end to end.',
		live: 'https://tn-hub-sable.vercel.app/',
		source: 'https://github.com/Arul-Prakash-K-C/TN-HUB',
		shots: [],
		routeMap: [
			{ group: 'Public', items: ['Service catalogue', 'Apply for a service', 'Certificate view', 'Help & tutorials', 'Guided assistant'] },
			{ group: 'Citizen', items: ['Dashboard', 'Applications', 'Document vault', 'Complaints', 'Notifications'] },
			{ group: 'Department & officer', items: ['Application review', 'Reports', 'Settings'] },
			{ group: 'Operator & admin', items: ['Assisted applications', 'Grievances', 'Approvals', 'Helpdesk'] }
		],
		problem:
			'Citizens have to navigate many disconnected government portals; the app’s own pitch is “Government services shouldn’t feel fragmented.”',
		users: 'Citizens, department officers, service-centre operators and administrators.',
		features: [
			'Public service catalogue with per-service pages and an online application flow.',
			'Application workflow with staged statuses, from submission through document verification, officer review and field verification to approval and certificate generation.',
			'Citizen dashboard with applications, a document vault, complaints and notifications.',
			'Separate role portals for departments, operators and admins, protected by server-side route authorisation.',
			'English and Tamil interface.',
			'“Thozhan”, a menu-driven help assistant for finding services, tracking applications and checking required documents.',
			'Fee payment with OTP confirmation, clearly marked as a simulation in this prototype.'
		],
		architecture:
			'SvelteKit app (Vercel adapter) with server API routes over Firebase: Authentication with server sessions, Firestore and Storage protected by security rules, and the Firebase Admin SDK on the server.',
		stack: ['SvelteKit', 'Svelte 5', 'Tailwind CSS v4', 'Firebase Auth', 'Firestore', 'Firebase Storage', 'Vitest', 'Vercel'],
		choices: [
			'Authorisation is checked on the server for each role group, with rate limiting and input validation on API routes.',
			'Security, route-boundary and i18n behaviour are covered by Vitest suites.',
			'Payments are simulated on purpose, so no real money moves in the prototype.'
		],
		evidence: 'Public source code (routes, API handlers, translations, tests) and commit history. Live site not inspected from this build environment.'
	},
	{
		id: 'agri-sphere',
		title: 'Agri-Sphere',
		kicker: 'Farm management + direct marketplace',
		year: '2026',
		status: 'Live',
		summary:
			'A smart agriculture platform where farmers manage crops, harvests, inventory and expenses, diagnose crop disease from a photo, and sell produce directly to customers.',
		team: 'Built with Moulishwar G (shared commit history)',
		role: 'Co-developer: one of two main contributors in the repository history.',
		live: 'https://agri-sphere-two.vercel.app/',
		source: 'https://github.com/Arul-Prakash-K-C/Agri-Sphere',
		shots: [],
		routeMap: [
			{ group: 'Farmer', items: ['Dashboard', 'Crops', 'Harvests', 'Inventory', 'Expenses', 'Sales', 'Products', 'Irrigation', 'Disease scan'] },
			{ group: 'Customer', items: ['Marketplace dashboard', 'Compare', 'Favourites', 'Wishlist'] },
			{ group: 'Admin', items: ['Farmer verification', 'Dashboard'] },
			{ group: 'Shared', items: ['Task list', 'Settings', 'Notifications'] }
		],
		problem: 'Farmers juggle records on paper and sell through middlemen; the platform puts operations and direct sales in one place.',
		users: 'Farmers, customers (buyers) and administrators.',
		features: [
			'Crop, harvest, inventory, expense and sales management for farmers.',
			'AI crop-disease detection: upload a leaf or plant image and get a diagnosis with treatment suggestions (Google Gemini).',
			'Weather-aware irrigation scheduling using Open-Meteo forecasts.',
			'Dashboard and analytics on profitability, expenses and yields, with downloadable PDF reports.',
			'Customer marketplace with product comparison, favourites and wishlist.',
			'Admin verification of newly registered farmers before they can sell.'
		],
		architecture:
			'SvelteKit (Svelte 5) front end; SvelteKit server routes act as the API and proxy for Firebase (Auth + Firestore via the Admin SDK) and for external calls to Gemini and Open-Meteo.',
		stack: ['SvelteKit', 'Svelte 5', 'Tailwind CSS', 'Firebase Auth', 'Firestore', 'Gemini API', 'Open-Meteo', 'jsPDF', 'Vercel'],
		choices: [
			'External API keys stay on the server: the browser talks only to SvelteKit endpoints.',
			'Role-based routing for farmer, customer and admin portals.'
		],
		evidence: 'Public source code, README and commit history. Live site not inspected from this build environment.'
	},
	{
		id: 'vazhi',
		title: 'Vazhi',
		kicker: 'Bus travel, booked and boarded',
		year: '2026',
		status: 'Live',
		summary:
			'A Tamil Nadu public-transit booking app in English and Tamil, with four roles covering trip search, seat selection, payment, QR boarding verification and fleet operations.',
		team: 'Team project · repository on Moulishwar G’s account',
		role: 'Contributor; individual responsibilities to be added.',
		live: 'https://vazhi-chi.vercel.app/',
		source: 'https://github.com/unpredicatable123/VAZHI',
		shots: [],
		routeMap: [
			{ group: 'Traveller', items: ['Explore trips', 'Seat selection', 'Passengers & payment', 'Ticket & PNR', 'Trip tracking', 'Refunds'] },
			{ group: 'Conductor', items: ['Trip', 'Passengers', 'Verify boarding'] },
			{ group: 'Driver', items: ['Trip', 'Stops', 'Status'] },
			{ group: 'Operations', items: ['Buses', 'Trips', 'Drivers', 'Conductors', 'Assignments', 'Refunds'] }
		],
		problem: 'Booking, boarding and fleet records for intercity buses live in separate places.',
		users: 'Travellers, conductors, drivers and operations staff.',
		features: [
			'Trip search with seat and sleeper berth selection, fare summary, PNR tickets and refunds.',
			'Payment through Razorpay in sandbox mode, and ticket e-mails from a Cloud Function.',
			'QR-based boarding verification for conductors.',
			'Map view with live tracking that is simulated from the timetable (no real GPS feed).',
			'English and Tamil interface.'
		],
		architecture:
			'SvelteKit SPA on Firebase: Firestore with security rules, Cloud Functions for payments and ticket e-mail, MapLibre for maps. Data model: a trip joins a bus, a route and a crew; bookings reference trips.',
		stack: ['SvelteKit', 'Svelte 5', 'TypeScript', 'Firebase', 'Cloud Functions', 'MapLibre GL', 'Razorpay (sandbox)'],
		choices: [
			'Privacy rules enforced by types and Firestore rules: conductors see a PNR, a seat and boarding status, not passenger names.',
			'Firestore security rules are tested against the emulator.'
		],
		evidence: 'Public source code and README. Arul’s individual contribution is not yet documented.'
	},
	{
		id: 'safescan',
		title: 'SafeScan',
		kicker: 'Scam check from a screenshot',
		year: '2026',
		status: 'Research project',
		summary:
			'A web app that judges whether a chat or e-mail screenshot is a scam without opening any link, scanning any QR code or contacting the sender, and explains its verdict in plain language.',
		team: 'Team of three · MCA Mini Project (with Kiran V and Moulishwar G)',
		role: 'Co-developer in a three-person team.',
		live: '',
		source: 'https://github.com/unpredicatable123/AI-powered-scam-detection-from-screenshot',
		shots: [
			{ src: '/projects/safescan-analyze.webp', alt: 'SafeScan analyze page with an uploaded screenshot and a scan status card showing a scam verdict.' },
			{ src: '/projects/safescan-verdict.webp', alt: 'SafeScan verdict card listing the reasons for the decision and what to do next.' },
			{ src: '/projects/safescan-history.webp', alt: 'SafeScan scan history page stored only in the browser.' }
		],
		problem:
			'The usual ways of checking a suspicious message (following the link, scanning the code, replying) are exactly what the scammer wants.',
		users: 'Anyone who receives a suspicious SMS, WhatsApp, Telegram, Instagram or e-mail message. No account needed.',
		features: [
			'Upload a screenshot; text is read with Tesseract OCR and QR codes are decoded but never followed.',
			'Interpretable features: persuasion language, money and credential requests, link risk, UPI IDs, QR payload type and layout.',
			'Calibrated XGBoost classifier plus a scam-category model.',
			'SHAP-based reasons that quote the message, a 0–100 risk score and matched safety advice.',
			'Private scan history kept only in the browser.'
		],
		architecture:
			'SvelteKit web app (Vercel) forwards the upload to a Python FastAPI service (Docker on Render) that runs OCR, QR decoding, feature extraction, Sentence-BERT embedding, classification and explanation.',
		stack: ['SvelteKit', 'Python', 'FastAPI', 'Tesseract OCR', 'Sentence-BERT', 'XGBoost', 'SHAP', 'Docker'],
		choices: [
			'No public scam-screenshot dataset exists, so 13,715 training images were rendered from 15 public text datasets in five platform styles.',
			'Every module follows one rule: nothing found in a screenshot is ever opened.'
		],
		outcomes: [
			'91.7% accuracy, 93.1% precision, 90.4% recall and ROC-AUC 0.975 on 1,372 held-out test screenshots.',
			'Run end-to-end on 154 real scam screenshots, it flagged 143 (92.9%); every miss was a promotional message.',
			'The false-alarm rate on real genuine messages has not been measured yet; that is listed as the first piece of future work.'
		],
		evidence: 'Project report (Oct 2026) and UI screenshots from its appendix. Figures are as reported there.'
	},
	{
		id: 'hexoria',
		title: 'Hexoria Academy',
		kicker: 'Cloud-hosted learning platform',
		year: '2026',
		status: 'Live',
		summary:
			'A learning-management system with student, instructor and admin roles: course builder, video lessons, quizzes, progress tracking and certificates.',
		team: 'Team project · Arul’s fork of the shared repository',
		role: 'Contributor; individual responsibilities to be added.',
		live: 'https://cloude-project-inky.vercel.app/',
		source: 'https://github.com/Arul-Prakash-K-C/Cloude-project',
		shots: [],
		routeMap: [
			{ group: 'Student', items: ['Course listing', 'Course player', 'My courses', 'Wishlist & cart', 'Certificates'] },
			{ group: 'Instructor', items: ['Course builder', 'Quiz manager', 'Student management'] },
			{ group: 'Admin', items: ['Admin dashboard'] }
		],
		problem: 'Course content, assessments and progress tracking are often spread across separate tools.',
		users: 'Students, instructors and administrators.',
		features: [
			'Multi-step course builder for instructors, with lessons and quizzes.',
			'Course player, progress tracking and certificate pages for students.',
			'Private media delivered from AWS S3 through pre-signed URLs.',
			'JWT authentication with bcrypt-hashed passwords.'
		],
		architecture:
			'React 18 + Vite front end (React Three Fiber hero scene) calling a Node.js/Express REST API backed by PostgreSQL, with media in AWS S3.',
		stack: ['React 18', 'Vite', 'React Three Fiber', 'Node.js', 'Express', 'PostgreSQL', 'JWT', 'AWS S3'],
		choices: ['Video and files are served through short-lived pre-signed S3 URLs rather than public links.'],
		evidence: 'Public source code and a cloud-computing project report. Arul’s individual contribution is not yet documented.'
	}
];

/** Smaller, earlier work — shown as compact log entries. All from Arul’s own public repositories. */
export const logEntries = [
	{
		title: 'Book N Play: Turf Booking',
		year: '2024 – 2025',
		summary:
			'Turf and play-area booking site. Started as static HTML/CSS pages, then rebuilt as a React front end with a Node.js/Express + MongoDB API using JWT authentication.',
		stack: ['React', 'Vite', 'Express', 'MongoDB', 'JWT'],
		links: [
			{ label: 'React app', href: 'https://github.com/Arul-Prakash-K-C/Turf-Booking-React' },
			{ label: 'API', href: 'https://github.com/Arul-Prakash-K-C/Turf-Booking-Backend' },
			{ label: 'First HTML version', href: 'https://github.com/Arul-Prakash-K-C/turf-booking' }
		]
	},
	{
		title: 'SAST society website',
		year: '2026',
		summary: 'Single-page website for the Society for Applied Sciences and Technologies.',
		stack: ['HTML', 'CSS'],
		links: [{ label: 'Source', href: 'https://github.com/Arul-Prakash-K-C/SAST-2' }]
	},
	{
		title: 'React To-Do List',
		year: '2025',
		summary: 'Task list with add, edit and delete, with a version that persists tasks in localStorage.',
		stack: ['React', 'Vite'],
		links: [{ label: 'Source', href: 'https://github.com/Arul-Prakash-K-C/To-Do-List' }]
	},
	{
		title: 'React Calculator',
		year: '2025',
		summary: 'Calculator built from small components sharing state through React Context.',
		stack: ['React', 'Vite'],
		links: [{ label: 'Source', href: 'https://github.com/Arul-Prakash-K-C/Calculator-react' }]
	},
	{
		title: 'Penalty Shoot & Tic-Tac-Toe',
		year: '2024',
		summary: 'Two browser games written in plain JavaScript.',
		stack: ['HTML', 'CSS', 'JavaScript'],
		links: [
			{ label: 'Penalty Shoot', href: 'https://github.com/Arul-Prakash-K-C/Penaulty-Shoot-Game' },
			{ label: 'Tic-Tac-Toe', href: 'https://github.com/Arul-Prakash-K-C/Tic-Tac-Toe-Game' }
		]
	},
	{
		title: 'Location Map',
		year: '2024',
		summary: 'Small demo that shows the visitor’s position on a map using the browser Geolocation API.',
		stack: ['HTML', 'JavaScript', 'Geolocation API'],
		links: [{ label: 'Source', href: 'https://github.com/Arul-Prakash-K-C/Projectmaps' }]
	}
];
