# Cinematic footage plan (Higgsfield · Seedance 2)

The site runs entirely on the real-time WebGL film. The Seedance footage is an additional
scroll-scrubbed layer (`src/video/FrameSequence.tsx`) blended behind and into the 3D, so the two
never read as separate worlds. This document is the production plan for that layer.

## Rules

1. **Still frames first.** Every key start frame is generated as an image in the brand palette and
   approved before any motion is produced. Nothing below is rendered as video until the stills are signed off.
2. **One unbroken chain.** Clip N+1 starts from the exact last frame of clip N (image-to-video). The prompt
   skeleton, camera language, lens, lighting and drone scale are held constant so the join is invisible.
   Once the chain has begun, no scene is generated from a fresh text prompt alone.
3. **No text in the footage.** All copy, counters, icons and labels stay in the DOM.
4. **Format.** 16:9, the highest resolution and frame rate Seedance 2 offers. Frames are split with
   `scripts/extract-frames.mjs` into WebP sequences and bound to film percentages in `public/film/manifest.json`.

## Shared prompt skeleton

> Continuous cinematic shot, one matte navy quadcopter with Elyon Blue (#1E63D6) accents and a gimbal LiDAR
> pod, over a night-time Addis Ababa rendered only in deep navy (#0A1B33), navy (#113B6B), Elyon Blue,
> sky blue (#4FA5FF) and ice (#BDE2FF). 35 mm lens, gentle camera moves, no cuts, no text, no other hues,
> subtle film grain, depth from glow not shadow.

## Key start frames (stills to approve)

| # | Frame | Scene boundary |
|---|-------|----------------|
| K0 | Drone at rest on a rooftop helipad at dawn, single ice rim light, city below | 0 → 1 |
| K1 | Drone climbing, city unfolding beneath, light rail as a thin sky-blue ribbon, Entoto on the horizon | 1 → 2 |
| K2 | LiDAR cone sweeping, buildings turning to point clouds | 2 → 3 |
| K3 | Hovering over a glowing wireframe twin, camera orbiting | 3 → 4 |
| K4a | The twin revealed to be sitting on a laptop (bridging clip A) | 4 |
| K4b | Drone passing through rippling screen glass toward the viewer (bridging clip B) | 4 → 5 |
| K5 | Ascending helix around a 46-storey tower with a curved glass crown | 5 → 6 |
| K6a | Tower split down the middle: physical left, digital right (bridging clip A) | 6 |
| K6b | Sensors lighting floors on both halves (bridging clip B) | 6 → 7 |
| K7 | Straight-down view, parcel lines drawing, blocks extruding | 7 → 8 |
| K8 | Highland terrain with contour lines and a dotted sky-blue wave | 8 → 9 |
| K9 | Data layers stacking into a cube under the drone at sunrise | 9 → 10 |
| K10 | Drone landing on the pad as the world turns ice and white | 10 |

## Clip chain

| Clip | From → To | Film % | Notes |
|------|-----------|--------|-------|
| C01 | K0 → K1 | 0 – 12 | rotors spin up on the first frames |
| C02 | K1 → K2 | 12 – 22 | lawn-mower pattern, cone sweeps with the pace |
| C03 | K2 → K3 | 26 – 31 | 180° orbit |
| C04a | K3 → K4a | 31 – 34 | pull back until the laptop materialises |
| C04b | K4a → K4b | 34 – 40 | **hardest join**: through the glass, scale continuous |
| C05 | K4b → K5 | 40 – 54 | helix |
| C06 | K5 → K6 | 54 – 62 | **hardest join**: split wipe, then sensors (merged into one clip in production) |
| C07 | K6b → K7 | 62 – 72 | tilt to top-down |
| C08 | K7 → K8 | 72 – 84 | out over the Entoto hills |
| C09 | K8 → K9 | 84 – 92 | home at sunrise |
| C10 | K9 → K10 | 92 – 100 | landing, dawn wipe |

## Integration

`docs/film-plan.json` holds the machine-readable version. After the clips are approved and downloaded:

```bash
FFMPEG=ffmpeg node scripts/extract-frames.mjs docs/film-plan.json
```

The site picks up `public/film/manifest.json` automatically; the layer stays dormant without it.
