// Interaction smoke test: drives the film, the playground, the summary, the founders switch and the form, and reports page errors.
import { chromium } from 'playwright'
const url = process.argv[2] ?? 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error' && !/WebGL|useProgram/.test(m.text())) errors.push('console: ' + m.text().slice(0, 200)) })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(4500)
const film = await page.evaluate(() => { const f = document.getElementById('film'); return { top: f.offsetTop, h: f.offsetHeight, vh: innerHeight } })
const go = async (p) => { await page.evaluate((y) => window.scrollTo(0, y), film.top + p * (film.h - film.vh)); await page.waitForTimeout(900) }
const log = (...a) => console.log(...a)
// summary overlay
await page.getByRole('button', { name: 'Skip to summary' }).click(); await page.waitForTimeout(300)
log('summary open:', await page.getByRole('dialog').isVisible())
await page.keyboard.press('Escape'); await page.waitForTimeout(200)
// playground
await go(0.24)
log('playground active:', await page.evaluate(() => document.querySelector('[aria-label="Point size"]') !== null))
await page.getByRole('button', { name: 'Classification' }).click()
await page.getByRole('button', { name: 'Measure' }).click()
await page.mouse.click(600, 500); await page.waitForTimeout(100); await page.mouse.click(900, 520); await page.waitForTimeout(400)
log('measure text:', (await page.locator('text=/Δh/').count()) > 0)
await page.getByRole('button', { name: 'Vegetation' }).click()
// sync scene hover toggles
await go(0.58)
const sensor = page.locator('.sensor').first()
if (await sensor.count()) { await sensor.hover(); await sensor.click(); await page.waitForTimeout(300); log('floor toggled:', (await page.locator('text=/follows 120 ms/').count()) > 0) } else log('no sensors found')
// free flight easter egg
await go(0.75)
await page.keyboard.type('elyon'); await page.waitForTimeout(300)
log('free flight:', (await page.locator('text=Free flight').count()) > 0)
await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(3200)
// founders + form
await go(1.0)
await page.evaluate(() => document.getElementById('about').scrollIntoView())
await page.waitForTimeout(800)
log('founders on page:', await page.locator('#founder-hundaol, #founder-dagim').count())
await page.evaluate(() => document.getElementById('contact').scrollIntoView()); await page.waitForTimeout(2600)
await page.fill('input[name=name]', 'Test'); await page.fill('input[name=email]', 't@example.com')
await page.getByRole('button', { name: 'Request a demo' }).last().click(); await page.waitForTimeout(1600)
log('form done:', (await page.locator('text=Flight plan received.').count()) > 0)
log('title at end:', await page.title())
log('errors:', errors.length ? errors : 'none')
await browser.close()
