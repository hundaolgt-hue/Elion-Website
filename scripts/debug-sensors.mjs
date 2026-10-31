import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' }); await page.waitForTimeout(4000)
const film = await page.evaluate(() => { const f = document.getElementById('film'); return { top: f.offsetTop, h: f.offsetHeight, vh: innerHeight } })
await page.evaluate((y) => window.scrollTo(0, y), film.top + 0.58 * (film.h - film.vh)); await page.waitForTimeout(1500)
console.log(await page.evaluate(() => {
  const e = document.querySelector('.sensor'); if (!e) return 'none'
  const chain = []; let n = e.parentElement
  while (n && n !== document.body) { const r = n.getBoundingClientRect(); chain.push({ tag: n.tagName, id: n.id, cls: (n.className || '').toString().slice(0, 40), pos: getComputedStyle(n).position, y: Math.round(r.y), h: Math.round(r.height) }); n = n.parentElement }
  return { scrollY, chain }
}))
await browser.close()
