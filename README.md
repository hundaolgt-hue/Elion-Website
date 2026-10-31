# Elyon Aerial Services — website

One drone, one city, one unbroken scroll. The official site for Elyon Aerial Services (LiDAR drone
scans, surveying, digital twins, scan-to-BIM, 3D cadastre and AI-ready data, Addis Ababa) is a single
scroll-driven film: the drone takes off from a rooftop helipad, scans Addis Ababa, hardens the city into a
digital twin, flies out of the AI Data Platform's laptop, models the CBE tower, syncs physical and digital,
draws the 3D cadastre, crosses the highland and lands at dawn in front of the founders.

## Stack

- Vite 8 + React 19 + TypeScript
- Three.js via React Three Fiber and Drei, `postprocessing` for bloom, grain, aberration, vignette and the screen-glass ripple
- GSAP 3 + ScrollTrigger as the single timeline authority, Lenis for smoothed scrolling
- Tailwind 4 for layout; every brand token is a CSS variable in `src/styles/tokens.css`
- Zustand for the film state shared by the WebGL layer, the DOM overlays and the sound layer

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build to dist/
npm run preview      # serve dist/ on http://localhost:4173
```

## Deploy (Vercel)

Import the repository in Vercel with framework preset **Vite** (build `npm run build`, output `dist`).
`vercel.json` adds the 404 page, immutable caching for hashed assets and the security headers. No environment
variables are required.

## Scripts

| Command | What it does |
|---------|--------------|
| `node scripts/shoot.mjs [url] [dir] [w] [h] [p1,p2,…]` | Screenshots the film at a list of progress values (used for every visual check) |
| `node scripts/record.mjs` | Renders a 30 s, 60 fps scroll-through to `docs/scroll-recording.mp4` |
| `node scripts/build-sprite.mjs` | Writes the icon library to `public/icons/sprite.svg` |
| `node scripts/export-drone.mjs` | Exports the drone to `public/models/elyon-drone.glb` (run against `npm run preview`) |
| `node scripts/extract-frames.mjs docs/film-plan.json` | Splits approved Seedance clips into scroll-scrubbable frame sequences |

## Architecture

```
src/
  lib/film.ts          master GSAP timeline (0..100 = film percent), ScrollTrigger scrub, Lenis, flyTo(), keyboard scrubbing
  lib/store.ts         zustand film state, scene table, quality tier detection
  three/choreo.ts      ONE pure function of progress -> drone pose, camera pose, every scene uniform
  three/Stage.tsx      the persistent WebGL canvas; everything below reads poseRef each frame
  three/Drone.tsx      procedural quadcopter: rotors + blur disc, gimbal pod, scan cone, rotor wash, lamp
  three/Buildings.tsx  instanced city with one shader: night windows, scan dissolve, wire->glass twin, dawn
  three/PointCloud.tsx GPU LiDAR cloud (up to 1.4 M points): survey-order birth, colour modes, slice, class mask, density
  three/Terrain.tsx    heightfield terrain, street grid, 1 m contours, flood layer, dotted terrain wave
  three/Landmarks.tsx  CBE tower (BIM build, deviation, physical/digital split, live floors), launch pad, light rail, sky dome
  three/Laptop.tsx     the AI Data Platform laptop around the twin
  three/Cadastre.tsx   parcel lines that draw themselves and floor slabs that extrude
  three/DataStack.tsx  the layered data cube under the drone
  three/Effects.tsx    bloom + ElyonEffect (navy vignette, 3 % grain, edge aberration, ripple)
  ui/                  DOM overlays per scene, HUD, counters (odometer), playground controls, navbar, rail, cursor, founders, contact, footer
  icons/registry.tsx   60+ line icons, each with a draw-in and an idle loop
  world/               procedural Addis Ababa (city.ts), heightfield (terrain.ts), point sampler (pointcloud.ts)
  video/FrameSequence.tsx scroll-scrubbed footage layer (dormant until public/film/manifest.json exists)
```

### Scene table (film percent)

| # | Scene | Range |
|---|-------|-------|
| 00 | Launch pad | 0–4 |
| 01 | Take-off over Addis Ababa | 4–12 |
| 02 | LiDAR scan (lawn-mower survey) | 12–24 |
| 02b | Point-cloud playground (pinned, interactive) | 22–26 |
| 03 | Digital twin (180° orbit, layers) | 26–31 |
| 04 | AI Data Platform (laptop materialises) | 31–34 |
| 04b | Through the screen | 34–40 |
| 05 | Scan-to-BIM (CBE tower helix) | 40–54 |
| 06 | Live twin (physical / digital split) | 54–62 |
| 07 | 3D cadastre (top-down) | 62–72 |
| 08 | For all industries (highland vignettes) | 72–84 |
| 09 | End to end (data stack, pipeline) | 84–92 |
| 10 | Landing, dawn wipe, founders | 92–100 and the flow section after the film |

## Data notes

- The city is procedural (`src/world/city.ts`): Meskel Square at the origin, the Bole Road corridor to the
  south-east, the CBE headquarters tower to the north-west, the light rail through the square, the Entoto ridge
  to the north. Overpass (OpenStreetMap) was not reachable from the build environment; `generateCity()` is the
  single place to swap in real footprints and a DEM.
- UTM 37N read-outs in the playground use an approximate origin at Meskel Square (`src/lib/math.ts`).

## Founders

Names, roles and bios live in `src/data/founders.ts`. Portraits are expected at `public/founders/hundaol.jpg`
and `public/founders/dagim.jpg` (4:5). Until a file exists the card shows the LiDAR sweep over a point field.

## Accessibility

All copy is DOM text; headings per scene; skip links; keyboard scrubbing (arrows, Page Up/Down, Space);
`prefers-reduced-motion` swaps the film for static keyframes; 44 px touch targets; hover information also
appears on tap; Ice/Sky on navy meet WCAG AA for the sizes used.

## Easter eggs

Particle mark at take-off · pigeon flock and cattle herd auto-classified · the laptop cursor mirrors yours ·
bidirectional floor toggling · the VERIFIED stamp at your cursor · type `elyon` for 3 s of free flight ·
`/404.html` is the drone searching an empty grid · animated favicon · the tab reads "Landed." at 100 %.
