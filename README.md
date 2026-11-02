# Arul Prakash K C — Portfolio

A one-page developer portfolio with an original moonlit-sea, pirate-and-robot theme.
Built with **SvelteKit + Svelte 5** (Arul's main stack) and a hand-written **Three.js** scene. It's exported as a static site.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in ./build
npm run preview    # serve the production build
npm run check      # svelte-check
```

### Deploying to Vercel

`vercel.json` pins the SvelteKit framework preset and the install and build commands. `adapter-static` detects Vercel and writes Vercel's own output format, so no output directory needs setting.

Vercel builds the repository's **production branch** (currently `master`). That branch has to contain this code; if it only has the README, the build fails with `Command "vite build" exited with 127`, because nothing gets installed. Merge the work into `master`, or point Vercel at the branch that has it. If the project was created with the **Vite** preset, change it to **SvelteKit** (or leave it to `vercel.json`).

For any other static host, deploy the `build/` folder.

## Where things live

| Path | What |
| --- | --- |
| `src/lib/data/profile.js` | Name, contact, résumé link, education, experience, certifications, skills |
| `src/lib/data/projects.js` | Voyage log: project case studies and smaller log entries |
| `src/lib/scene/voyage.js` | The 3D scene: Gerstner-wave ocean, sky and clouds, fog banks, camera path and the film post-processing chain |
| `src/lib/scene/galleon.js` | The original galleon, *The Night Compiler*: a lofted hull with procedural textures, rig, sails and the robot crew member |
| `src/lib/components/` | Page sections, the case-study dialog, nav and the robot companion ("Bit") |
| `static/projects/` | Project screenshots |

Empty fields are **hidden**, never shown as placeholders. Fill them in and the matching UI appears:

- `profile.email`, `profile.phone`: show the contact rows, with copy buttons.
- `profile.resumeUrl`: put the PDF at `static/resume.pdf` and set this to `'/resume.pdf'`. That adds **View Resume** to the nav, hero and contact sections.
- `profile.socials`: add LinkedIn and others once the real URLs are confirmed.
- `experience[0].points`: internship responsibilities.
- `certifications`: the section appears once this has entries.
- `siteUrl` in `src/routes/+page.svelte`: the deployed URL, used for absolute social-preview links.

## How the 3D works

- The hero renders text and an illustrated SVG fallback immediately. The Three.js chunk (~540 kB) is imported lazily after first paint, so nothing blocks on it.
- **Phones and Data Saver:** they keep the illustration and get a **Load 3D scene** button instead.
- **No WebGL or a lost context:** the illustration stays.
- **`prefers-reduced-motion`:** a single still frame, with animation only if the visitor asks for it.
- The scene pauses when it scrolls offscreen or the tab is hidden. A **Pause scene** button is always available.
- **Desktop:** the scene runs through a film-style post-processing chain: bloom, a teal-and-amber grade, grain and a vignette. Phones skip it for performance.
- Scrolling through the hero moves the camera from a wide shot, past the deck, up into the stars. It never pins or hijacks scrolling.

## Content sources

Every claim is backed by a source, and each case study names its own:

- **Project-Sync** and **SafeScan**: the supplied project reports (Oct 2026). Screenshots come from the reports' appendices.
- **TN Kuviyam (TN-HUB)**, **Agri-Sphere**, **Vazhi** and **Hexoria Academy**: their public source code, READMEs and git history. The deployed sites couldn't be opened from the build environment, so these cards show a *route map* read from the source until screenshots are added.
- Education dates come from Arul's previous portfolio (`Arul-Prakash-K-C/Portfolio`). The internship and skills list come from the résumé summary in the brief. **Check both against the résumé PDF.**

## Assets and licenses

| Asset | Source | License |
| --- | --- | --- |
| Galleon, robot, ocean, sky, textures, favicon, fallback illustration | Original, generated in code for this site (the galleon is an original design, not a replica of any film or game ship) | Part of this repo |
| Project screenshots | Arul's own project reports | Arul's own work |
| Cinzel font | `@fontsource/cinzel` | SIL OFL 1.1 |
| Inter font | `@fontsource-variable/inter` | SIL OFL 1.1 |
| JetBrains Mono font | `@fontsource/jetbrains-mono` | SIL OFL 1.1 |
| three.js | npm `three` | MIT |
| SvelteKit / Svelte / Vite | npm | MIT |

No code, models, images or music were taken from the reference sites.
