// Render a 30 s, 60 fps scroll-through of the film (1800 frames) and encode it with ffmpeg.
// Usage: node scripts/record.mjs [url] [out.mp4] [seconds] [fps]
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
const [, , url = 'http://localhost:4173/', out = 'docs/scroll-recording.mp4', seconds = '30', fps = '60'] = process.argv
const N = Number(seconds) * Number(fps)
const dir = '.record-frames'
rmSync(dir, { recursive: true, force: true })
mkdirSync(dir, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(4000)
const film = await page.evaluate(() => { const f = document.getElementById('film'); return { top: f.offsetTop, h: f.offsetHeight, vh: innerHeight } })
for (let i = 0; i < N; i++) {
  const t = i / (N - 1)
  const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  await page.evaluate((y) => window.scrollTo(0, y), film.top + e * (film.h - film.vh))
  await page.waitForTimeout(16)
  await page.screenshot({ path: `${dir}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 85 })
  if (i % 120 === 0) console.log(`frame ${i}/${N}`)
}
await browser.close()
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
execFileSync(ffmpeg, ['-y', '-framerate', fps, '-i', `${dir}/f%05d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', out], { stdio: 'inherit' })
console.log('wrote', out)
