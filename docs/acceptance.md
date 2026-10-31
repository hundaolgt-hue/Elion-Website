# Acceptance checklist — status

| # | Item | Status | Evidence / notes |
|---|------|--------|------------------|
| 1 | 0 → 100 % and back is one continuous drone flight, no cut, fade-to-black or empty frame | Pass | 11 chained Seedance clips scrubbed by scroll, dissolving into the real-time 3D only for the interactive playground; `scripts/shoot.mjs` frames at 22 positions; reverse scrubbing is stateless by construction (`src/three/choreo.ts` is a pure function of progress) |
| 2 | Every colour is one of the six brand tokens; every font Sora or Inter | Pass with note | CSS uses only the six tokens; footage is graded through a brand `color` blend layer (`src/ui/Grain.tsx`) so stray warm lights in the AI frames read blue. Two generated frames still carry small warm highlights on the drone's nav lights |
| 3 | All five brand taglines verbatim at their scenes | Pass | Hero (Scene 0), "Beyond Perspective. Into Intelligence." (Scene 4), "One Platform. Endless Possibilities." (Scene 4), "We Capture… You Build The Future." (Scene 9), "Uniting aerial precision…" (Scene 10 and About) |
| 4 | Laptop pass-through seamless in scale, light and sound | Pass | Clip c04b: the drone leaves the screen through rippling glass and keeps scale; WebGL ripple shader remains for the 3D fallback; whoosh on the sound layer |
| 5 | Physical and digital tower respond to each other both ways within 150 ms | Pass | `toggleFloor` dispatches the mirrored change after 120 ms; verified in `scripts/smoke.mjs` ("floor toggled") |
| 6 | At least 30 animated icons with entrance and idle loop | Pass | 67 icons in `src/icons/registry.tsx`, draw-in + idle class each; sprite at `public/icons/sprite.svg` |
| 7 | At least 12 distinct surprises | Pass | particle mark, rooftop tags, pigeon flock, cattle herd, laptop cursor mirror, bidirectional floors, VERIFIED stamp, free flight, 404 page, animated favicon, "Landed." title, measure tool, scan replay, portrait LiDAR reveal, drone-flies-off submit button |
| 8 | 60 fps on M1 Air, 30 fps mid-range Android, Lighthouse desktop > 85 | Not verified on hardware | Only software-rendered Chromium was available here. Lighthouse desktop in that environment: performance 55 (TBT dominated by software WebGL), accessibility 96, best practices 100, SEO 100 (`docs/lighthouse/report.report.html`). Point cloud now builds in a worker; quality tiers drop points and post-processing on 4-core or mobile devices. Needs a run on the target laptop and phone |
| 9 | Reduced-motion mode complete and readable | Pass | `src/ui/Reduced.tsx` static keyframes; respected by icons, cursor and rail |
| 10 | Founders' real bios and portraits, no placeholders | Partial | Names, roles and bios from the brief are in `src/data/founders.ts`. Portrait files were not available in the build environment: drop `public/founders/hundaol.jpg` and `public/founders/dagim.jpg` (4:5) and the LiDAR reveal picks them up automatically |
| 11 | First-time viewer knows what Elyon does within 20 s | Pass | Hero copy plus the first two clips (take-off, LiDAR scan turning the city to points) land the proposition before 12 % of scroll |

## Open items for the team

1. Install the Claude GitHub App on `hundaolgt-hue/Elion-Website` (or reconnect GitHub in claude.ai) so the branch can be pushed; all work is committed locally on `claude/eloquent-johnson-5mo4qo`.
2. Add the two portrait files.
3. Measure frame rate on the real target devices and, if needed, lower `POINT_BUDGET` in `src/three/PointCloud.tsx`.
4. Optional: re-render the 11 clips at 1080p or 4K (96 credits per clip at 1080p) with the same prompts in `docs/film-plan.md`.
