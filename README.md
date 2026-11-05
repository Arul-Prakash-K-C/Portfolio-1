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
| `src/lib/scene/voyage.js` | The 3D world and the **story timeline**: ocean, sky, fog, camera path through the six stages, prop animation, film post-processing |
| `src/lib/scene/galleon.js` | The original galleon, *The Night Compiler*: lofted hull, procedural textures, rig, sails and Bit the robot |
| `src/lib/scene/props.js` | Original story props: the captain, the ship's wheel, the chart table with a live treasure map, compass, telescope, logbook, treasure chest |
| `src/lib/scene/island.js` | Signal Isle: palms, stone tower, a brazier that ignites and a sweeping beam |
| `src/lib/scene/bus.js` | Tiny bridge so sections can tell the scene what's in focus (skill tab, project card) |
| `src/lib/components/SceneHost.svelte` | The fixed page-wide canvas: loading, fallback, pause, intro skip, and the scroll → timeline mapping |
| `src/lib/components/` | Page sections, the case-study dialog, nav and the robot companion ("Bit") |
| `static/projects/` | Project screenshots |

Empty fields are **hidden**, never shown as placeholders. Fill them in and the matching UI appears:

- `profile.email`, `profile.phone`: show the contact rows, with copy buttons.
- `profile.resumeUrl`: put the PDF at `static/resume.pdf` and set this to `'/resume.pdf'`. That adds **View Resume** to the nav, hero and contact sections.
- `profile.socials`: add LinkedIn and others once the real URLs are confirmed.
- `experience[0].points`: internship responsibilities.
- `certifications`: the section appears once this has entries.
- `siteUrl` in `src/routes/+page.svelte`: the deployed URL, used for absolute social-preview links.

## The voyage: how scrolling drives the story

One fixed canvas sits behind the page. Native scrolling (nothing pinned, no wheel hijacking) maps to a story timeline from 0 to 5. The camera holds on each stage while you read, then travels to the next one as the next section comes in, with a short fog dissolve between stages.

| Stage | Section | What happens in the scene |
| --- | --- | --- |
| 0 | Opening | On desktop the camera flies in from the water toward the ship (skippable; any scroll also skips it) |
| 1 | About | The camera boards the quarterdeck; the captain steers and the wheel turns |
| 2 | Skills | The chart table: the compass swings to the selected skill tab; Bit works the chart; the table lantern is lit |
| 3 | Projects | Top-down on the treasure map: the dotted route draws in as you scroll, and the island for the card in view pulses |
| 4 | Experience | The open logbook, quill and inkwell |
| 5 | Contact | Out over the bow: the treasure chest opens and the beacon on Signal Isle ignites |

## How the 3D works

- The hero renders text and an illustrated SVG fallback immediately. The Three.js chunk is imported lazily after first paint, so nothing blocks on it.
- **Phones and Data Saver:** they keep the illustrated page and get a **Load 3D voyage** button instead. Once loaded, they run a lighter version: no post-processing, fewer ocean vertices and stars.
- **Without the 3D scene:** About, Skills and Contact show small 2D stand-ins (wheel, compass, beacon), and every section keeps its own background.
- **No WebGL or a lost context:** the illustration stays.
- **`prefers-reduced-motion`:** a single still frame, with animation only if the visitor asks for it.
- The scene pauses when the tab is hidden and drops to ~30 fps when nobody is scrolling. A **Pause scene** control is always available (bottom-right on desktop, in the header on phones).
- **`prefers-reduced-motion`:** no fly-in and no animation loop; the camera cuts between stages instead of travelling.
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
| Galleon, fallback captain, captain animation, sea chart / flintlock / cutlass props, wheel, chart table, map, project islands, compass, telescope, logbook, chest, lighthouse ports, Signal Isle, ocean (waves, wake, spray, reflections), sky, textures, favicon, fallback illustrations | Original, generated in code for this site (no imported models; the ship and characters are original designs, not replicas of any film or game) | Part of this repo |
| Project screenshots | Arul's own project reports | Arul's own work |
| Captain portrait (`static/portrait/captain.webp`, `captain-640.webp`) | AI-generated with CellCog from Arul's own photo; original costume, not based on any film character; metadata stripped | Arul's own likeness, used with permission |
| 3D captain (`static/models/captain.glb`) | Mesh and texture generated with CellCog (rapid image-to-3D) from Arul’s own reference sheets (`set-1` turnaround); skeleton, skin weights and all animation built for this site (Blender script + code) | Arul’s own likeness, used with permission |
| Cinzel font | `@fontsource/cinzel` | SIL OFL 1.1 |
| Inter font | `@fontsource-variable/inter` | SIL OFL 1.1 |
| JetBrains Mono font | `@fontsource/jetbrains-mono` | SIL OFL 1.1 |
| three.js | npm `three` | MIT |
| SvelteKit / Svelte / Vite | npm | MIT |

No code, models, images or music were taken from the reference sites.

### Tooling notes

- **Three.js (vanilla):** the project already used it, so the scene stays on it rather than moving to Threlte.
- **Scroll timeline:** about 40 lines in `SceneHost.svelte` cover what GSAP ScrollTrigger would do here, without adding a dependency.
- **Blender and glTF Transform:** not available in the build environment and not needed. Every model is built procedurally, so there are no `.glb` files to optimise. If real models are added later, run them through `gltf-transform optimize` before putting them in `static/`.
