// Screenshot the film at a list of progress values. Usage: node scripts/shoot.mjs [url] [out-dir] [w] [h] [p1,p2,...]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const [, , url = 'http://localhost:4173/', out = 'shots', w = '1440', h = '900', list = '0,0.03,0.08,0.15,0.2,0.24,0.28,0.32,0.36,0.38,0.45,0.52,0.58,0.65,0.69,0.75,0.8,0.87,0.9,0.96,1,1.05'] = process.argv
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 })
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text().slice(0, 300)) })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(4500)
const film = await page.evaluate(() => { const f = document.getElementById('film'); return { top: f.offsetTop, h: f.offsetHeight, vh: innerHeight, doc: document.documentElement.scrollHeight } })
console.log('film', film)
for (const p of list.split(',').map(Number)) {
  const y = film.top + p * (film.h - film.vh)
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await page.waitForTimeout(1400)
  const prog = await page.evaluate(() => (window).__elyon?.progress)
  await page.screenshot({ path: `${out}/p${String(Math.round(p * 1000)).padStart(4, '0')}.jpg`, quality: 80, type: 'jpeg' })
  console.log('shot', p, 'progress', prog)
}
await browser.close()
