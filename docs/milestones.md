# Build milestones

The brief asked for the site to be built and shown in seven milestones. Each row names where the
milestone lives in the repository and how it was verified (`scripts/shoot.mjs` screenshots at film
percentages, `scripts/smoke.mjs` interaction run, Lighthouse in `docs/lighthouse/`).

| # | Milestone | Where | Verified |
|---|-----------|-------|----------|
| 1 | Static brand system and typography | `src/styles/tokens.css`, `src/brand/Mark.tsx`, `src/icons/registry.tsx`, `public/icons/sprite.svg` | sprite builds 67 icons; palette and type are CSS variables only |
| 2 | Drone model and persistent canvas with scroll scrub | `src/three/Drone.tsx`, `src/three/Stage.tsx`, `src/lib/film.ts`, `src/three/choreo.ts`, `public/models/elyon-drone.glb` | screenshots at 0–100 %; progress rail; keyboard scrub |
| 3 | Scenes 0 to 3 | `src/ui/scenes/{Launch,Takeoff,Scan,Playground,Twin}.tsx`, `src/three/{Buildings,PointCloud}.tsx` | footage clips c01, c02 scrubbed; playground controls exercised by the smoke test |
| 4 | Laptop transition and Scenes 4 to 6 | `src/three/Laptop.tsx`, `src/three/Landmarks.tsx` (CBE tower), `src/ui/scenes/{Platform,Bim,Sync}.tsx` | split view, sensors, bidirectional floor toggle verified |
| 5 | Scenes 7 to 10 and founders | `src/three/{Cadastre,DataStack}.tsx`, `src/ui/scenes/{CadastreUI,Land,Stack,Landing}.tsx`, `src/ui/About.tsx` | parcel cards, VERIFIED stamp, vignettes, dawn landing, founders switch, form |
| 6 | Icons, surprises, sound | `src/icons/`, `src/ui/Delights.tsx`, `src/lib/audio.ts`, `src/ui/Cursor.tsx` | free flight, favicon, tab title, summary, cursor modes |
| 7 | Mobile, accessibility, performance | bottom sheets, `Reduced.tsx`, worker point cloud, tiered quality, `vercel.json` | portrait screenshots at 390×844; Lighthouse a11y/SEO/best-practices |

## Cinematic footage

Produced with Higgsfield (Seedance 2.0) as a frame-to-frame chain from one approved still, see
`docs/film-plan.md`. Clips are split into 8 fps WebP sequences (desktop 1120 px, mobile 640 px) and
scrubbed by `src/video/FrameSequence.tsx`. Job ids are kept in `footage/jobs.json`.
