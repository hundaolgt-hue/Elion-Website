import { chromium, devices } from 'playwright';
// Mobile smoke test: iPhone emulation, real touch swipes through the film, the playground Touch toggle and a tap. Run against `npx vite preview --port 4173`.
const S = '/tmp/claude-0/-home-user-Elion-Website/dc864f04-c78f-5a92-8047-d6ae5176a95b/scratchpad';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto('http://localhost:4173/', { waitUntil: 'load' });
await p.waitForTimeout(6000);
const cdp = await ctx.newCDPSession(p);
const st = async () => p.evaluate(() => ({ y: Math.round(window.scrollY), prog: +(window.__elyon?.progress ?? 0).toFixed(3), bodyTA: document.body.style.touchAction || '(none)', canvasPE: getComputedStyle(document.querySelector('#stage canvas')).pointerEvents, canvasTA: document.querySelector('#stage canvas').style.touchAction }));
console.log('initial', JSON.stringify(await st()));
const swipe = async (d, n = 1) => { for (let i = 0; i < n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 600 }] }); for (let k = 1; k <= 12; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y: 600 - (Math.min(d, 560) * k) / 12 }] }); await new Promise(r => setTimeout(r, 16)); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(350); } await p.waitForTimeout(900); };
await swipe(500);
console.log('after one swipe', JSON.stringify(await st()));
await p.screenshot({ path: `${S}/mob-1.png` });
await swipe(560, 6);
console.log('after chapter swipes', JSON.stringify(await st()));
await p.screenshot({ path: `${S}/mob-2.png` });
// walk to the playground (~24 % of the 2200vh film)
for (let i = 0; i < 30; i++) { const s = await st(); if (s.prog >= 0.235) break; await swipe(560, 2); }
console.log('at playground', JSON.stringify(await st()));
await p.screenshot({ path: `${S}/mob-3.png` });
const btn = p.getByRole('button', { name: /Touch cloud/ });
console.log('touch toggle visible:', await btn.count());
if (await btn.count()) { await btn.first().tap(); await p.waitForTimeout(500); console.log('after touch on', JSON.stringify(await st())); await p.screenshot({ path: `${S}/mob-4.png` }); await p.getByRole('button', { name: /Touch on/ }).first().tap(); await p.waitForTimeout(400); console.log('after touch off', JSON.stringify(await st())); }
await swipe(560, 8);
console.log('after leaving playground', JSON.stringify(await st()));
await p.screenshot({ path: `${S}/mob-5.png` });
// tap on the film should not break anything
await p.touchscreen.tap(190, 300); await swipe(560);
console.log('after tap + swipe', JSON.stringify(await st()));
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await b.close();
