// Split approved Seedance clips into scroll-scrubbable WebP sequences (desktop 1280 px, mobile 720 px)
// and write public/film/manifest.json. Usage: node scripts/extract-frames.mjs docs/film-plan.json
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync, rmSync } from 'node:fs'

const planPath = process.argv[2] ?? 'docs/film-plan.json'
const plan = JSON.parse(readFileSync(planPath, 'utf8'))
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
const FPS = plan.fps ?? 10
const clips = []
const extract = (src, dir, width, quality) => {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-vf', `fps=${FPS},scale=${width}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', String(quality), '-compression_level', '6', `${dir}/t%04d.webp`])
  // ffmpeg numbers from 1; the player is 0-based
  const files = readdirSync(dir).filter((f) => f.endsWith('.webp')).sort()
  files.forEach((f, i) => renameSync(`${dir}/${f}`, `${dir}/f${String(i).padStart(4, '0')}.webp`))
  return files.length
}
for (const c of plan.clips) {
  if (!c.src || !existsSync(c.src)) { console.log(`skip ${c.id}: no source yet (${c.src ?? 'unset'})`); continue }
  const frames = extract(c.src, `public/film/${c.id}`, c.width ?? 1120, c.quality ?? 72)
  extract(c.src, `public/film/${c.id}/sm`, 640, 66)
  clips.push({ id: c.id, start: c.start, end: c.end, frames, pattern: `/film/${c.id}/f{i}.webp`, patternSm: `/film/${c.id}/sm/f{i}.webp`, blend: c.blend ?? 'normal', opacity: c.opacity ?? 1, fade: c.fade ?? 0.8, ...(c.hold ? { hold: c.hold } : {}), ...(c.recess ? { recess: c.recess } : {}) })
  console.log(`${c.id}: ${frames} frames`)
}
mkdirSync('public/film', { recursive: true })
writeFileSync('public/film/manifest.json', JSON.stringify({ clips }, null, 2))
console.log(`manifest: ${clips.length} clips`)
