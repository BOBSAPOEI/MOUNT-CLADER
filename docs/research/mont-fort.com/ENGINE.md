# Original WebGL engine (mont-fort.com, `_astro/App.*.js`, three.js r169)

One persistent renderer/scene shared by every page (Astro ClientRouter keeps it alive across navigations).

## Core
- **Global uniforms** `uTime, uPage (0 home,1 trading,2 capital,3 maritime,4 fort-energy), uChapter, uScrollProgress,
  uTransition*, uLightColor/uDarkColor (per page), uCapitalFog`; viewport uniforms `uRatio, uDPR, uResolution, uMobile`.
- **Page colours** (`uLightColor`, `uDarkColor`): home `#e8ecef/#5c7283`, trading `#8597af/#3c4e5f`,
  capital `#e2e2d7/#4fc3df`, maritime `#e2e3df/#6e92b8`, fort-energy `#3e9bb7/#081219`.
- **Assets**: global (`noise, perlinNoise, noise-solid-normal, rock_normal, voronoi`, `envmap-min.exr` → PMREM,
  `mountains.glb`), per page and per chapter manifests.
- **Materials** are swapped in by glTF material name (spaces, dashes, dots, digits stripped) → class registry
  (Mountain, Sky, Sea, Lake, Grid, Wireframe, Holograms, …). Unknown names fall back to the custom PBR material.
- **Main scene**: `Mountains` (the `Mountain` mesh of mountains.glb with the Mountain material), `Skybox` (Sky material),
  `Clouds`, `Flares` (capital sun), transition clouds/lines.
- **Camera** (fov 55, near 1, far 1000): position on `CameraPath` at `pageIndex / 4`, look-at on `TargetPath`
  (`TargetPath-Mobile` below 768px) at the page index. Chapter offsets (`chapterPosition/LookAt`) are tweened by the
  page hero on scroll. Mouse parallax every tick: lerp(mouse, dt*.5); translateX(x*.1) translateY(y*.2)
  rotateY(-x*.05) rotateX(y*.05). Secondary camera (fov 5, globe) and tertiary camera (fov 35, Fort Energy chapter).
- **Scroll**: `lerpedScroll = lerp(lerpedScroll, scrollY, dt*2)`. Each `[data-chapter]` element gets a range
  `[top - vh, bottom]` (first chapter: `[top, bottom]`); a paused GSAP timeline per chapter is scrubbed by progress
  over that range, a second "no overlap" timeline over `[top - vh, bottom - vh]`.
- **Mouse computation**: ping-pong 512² render target with a trailing mouse blob (used by Grid, Water, Wireframe).

## Division pages
| Page | Mountain config | Env | Chapters |
| --- | --- | --- | --- |
| Trading | trading-lightmap, snow + rock, mix snowRockMix | particles (80, blue) | Hero (hover particles on raycaster.glb), TradingChapter (two grids), Oil (wireframe barrels), Metals (wireframe bars) |
| Capital | capital-lightmap, snow + grass | capital-min.glb (prairie with lake reflector), flares | Hero, CapitalChapter (grass-min.glb) |
| Maritime | maritime-lightmap, rock + grass | maritime.glb (sea reflector, sea rocks, diffuse clouds) | Hero, MaritimeChapter (boat + water wake) |
| Fort Energy | (mountains hidden behind env) | fort-energy.glb (energy background, cones, power lines, glow) | Hero, FortEnergyChapter (energy-chapter.glb on tertiary camera: grid, holograms, lines) |

## Port in this repo
- Engine: `src/components/montfort/engine/` (shaders copied verbatim from the bundle; materials, scene, chapters and
  pages re-implemented in TypeScript). `DivisionScene` boots it per route and lazy-loads the page class.
- DOM: `src/components/montfort/divisions/content/*.tsx` is the original `<main>` markup converted to JSX; Astro scope
  attributes become `data-mf-<component>` and the matching rules (plus the few unscoped ones the components rely on,
  confined with `:where(main[data-division])`) live in `src/styles/montfort/divisions.css`.
- `[data-animation]` behaviours and the Trading chapters navigation are ported in `divisions/animations.ts` and
  `divisions/chaptersNavigation.ts`. GSAP lag smoothing is off, as on the original.
- Verified against a local mirror of the original at 1440×900 and 390×844: identical document heights on all four
  pages and matching 3D at every scroll stop.
