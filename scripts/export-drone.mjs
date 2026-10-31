// Export the procedural drone to glTF (binary) using the site's own scene graph.
// Starts a preview build with ?export=drone, runs GLTFExporter in the page, writes public/models/elyon-drone.glb.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
const url = process.argv[2] ?? 'http://localhost:4173/?export=drone'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.__elyonDroneGLB !== undefined, null, { timeout: 60000 })
const b64 = await page.evaluate(() => window.__elyonDroneGLB)
mkdirSync('public/models', { recursive: true })
writeFileSync('public/models/elyon-drone.glb', Buffer.from(b64, 'base64'))
console.log('wrote public/models/elyon-drone.glb', Buffer.from(b64, 'base64').length, 'bytes')
await browser.close()
