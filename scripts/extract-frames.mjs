// Split the Seedance clips into scroll-scrubbable WebP sequences and write public/film/manifest.json.
// Usage: node scripts/extract-frames.mjs docs/film-plan.json
// Each clip entry: { id, src (mp4), start, end (film percent), fps (default 24), width (default 1600), blend, opacity }
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'

const planPath = process.argv[2] ?? 'docs/film-plan.json'
const plan = JSON.parse(readFileSync(planPath, 'utf8'))
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
const clips = []
for (const c of plan.clips) {
  if (!c.src || !existsSync(c.src)) { console.log(`skip ${c.id}: no source yet (${c.src ?? 'unset'})`); continue }
  const dir = `public/film/${c.id}`
  mkdirSync(dir, { recursive: true })
  execFileSync(ffmpeg, ['-y', '-i', c.src, '-vf', `fps=${c.fps ?? 24},scale=${c.width ?? 1600}:-2`, '-quality', '82', `${dir}/f%04d.webp`], { stdio: 'inherit' })
  const frames = readdirSync(dir).filter((f) => f.endsWith('.webp')).length
  clips.push({ id: c.id, start: c.start, end: c.end, frames, pattern: `/film/${c.id}/f{i}.webp`, blend: c.blend ?? 'screen', opacity: c.opacity ?? 0.9 })
  console.log(`${c.id}: ${frames} frames`)
}
// frame names are 1-based from ffmpeg; the player is 0-based, so shift the pattern
mkdirSync('public/film', { recursive: true })
writeFileSync('public/film/manifest.json', JSON.stringify({ clips: clips.map((c) => ({ ...c, pattern: c.pattern })) }, null, 2))
console.log(`manifest: ${clips.length} clips`)
