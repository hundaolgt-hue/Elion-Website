import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/film'
import { Icon } from '@/icons/Icon'
import { Logo } from '@/brand/Logo'
import { FOUNDERS } from '@/data/founders'
import { generateCity } from '@/world/city'

/** Portrait revealed by a LiDAR scan sweep: points first, then the image resolves as the cone passes */
function ScanPortrait({ src, alt, active }: { src: string; alt: string; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement | null>(null)
  const prog = useRef(0)
  const draw = useRef<(k: number) => void>(() => {})
  useEffect(() => {
    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const W = (cv.width = 720), H = (cv.height = 900)
    // deterministic point field so the sweep is stable
    const pts: [number, number, number][] = []
    let seed = 7
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    for (let i = 0; i < 2600; i++) pts.push([rnd() * W, rnd() * H, rnd()])
    draw.current = (k: number) => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#113B6B'
      ctx.fillRect(0, 0, W, H)
      const sweep = k * (H + 160) - 80
      const im = img.current
      if (im && im.complete && im.naturalWidth) {
        const s = Math.max(W / im.naturalWidth, H / im.naturalHeight)
        const w = im.naturalWidth * s, h = im.naturalHeight * s
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, Math.max(0, sweep - 40)); ctx.clip()
        ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h)
        ctx.restore()
      }
      const hasImg = !!(im && im.complete && im.naturalWidth)
      // points below the sweep, densest right under it (or the whole frame when no portrait is loaded yet)
      for (const [x, y, r] of pts) {
        if (hasImg && y < sweep - 40) continue
        if (!hasImg) {
          const cx = (x - W * 0.5) / (W * 0.5), cy = (y - H * 0.42) / (H * 0.5)
          const head = Math.hypot(cx * 1.4, cy * 1.1 + 0.25) < 0.42 ? 1 : 0
          const body = cy > 0.25 && Math.abs(cx) < 0.55 + (cy - 0.25) * 0.6 ? 1 : 0
          if (!head && !body && r > 0.25) continue
        }
        const d = Math.min(1, Math.max(0, (y - sweep) / 220))
        ctx.fillStyle = r > 0.6 ? '#BDE2FF' : '#4FA5FF'
        ctx.globalAlpha = hasImg ? 0.25 + 0.75 * (1 - d) * (0.4 + 0.6 * r) : 0.35 + 0.5 * r
        ctx.fillRect(x, y, 2.4, 2.4)
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = '#4FA5FF'
      ctx.fillRect(0, sweep, W, 2)
      ctx.fillStyle = 'rgba(79,165,255,0.25)'
      ctx.fillRect(0, sweep - 18, W, 18)
    }
    const im = new Image()
    im.src = src
    im.onload = () => { img.current = im; draw.current(prog.current) }
    draw.current(0)
    const st = ScrollTrigger.create({ trigger: wrap.current, start: 'top 85%', end: 'top 25%', scrub: 0.4, onUpdate: (s) => { prog.current = s.progress; draw.current(s.progress) } })
    return () => st.kill()
  }, [src])
  useEffect(() => { if (active) gsap.fromTo({ k: 0 }, { k: 0 }, { k: prog.current || 1, duration: 1.4, ease: 'power2.inOut', onUpdate() { draw.current(this.targets()[0].k) } }) }, [active])
  return <div ref={wrap} className="w-full h-full"><canvas ref={canvas} className="w-full h-full object-cover" role="img" aria-label={alt} /></div>
}

/** Footer background: a faint live point cloud of the city, 2D so it costs nothing */
function FooterCloud() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!, ctx = cv.getContext('2d')!
    const city = generateCity()
    let raf = 0, t = 0
    const resize = () => { cv.width = cv.offsetWidth * devicePixelRatio; cv.height = cv.offsetHeight * devicePixelRatio }
    resize()
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) loop(); else cancelAnimationFrame(raf) })
    const loop = () => {
      t += 0.016
      ctx.clearRect(0, 0, cv.width, cv.height)
      const s = cv.width / 3600
      ctx.fillStyle = 'rgba(79,165,255,0.35)'
      for (let i = 0; i < city.buildings.length; i += 2) {
        const b = city.buildings[i]
        const x = (b.x + 1800) * s, y = (b.z + 1700) * (cv.height / 3400)
        const tw = 0.6 + 0.4 * Math.sin(t * 1.3 + i * 0.37)
        ctx.globalAlpha = tw * (0.2 + Math.min(1, b.h / 60) * 0.5)
        ctx.fillRect(x, y, 1.6 * devicePixelRatio, 1.6 * devicePixelRatio)
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(loop)
    }
    io.observe(cv)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full opacity-70" aria-hidden="true" />
}

/**
 * Founders, in the editorial hero grammar of the reference: each founder gets a full page with a
 * numbered index, a very large display name, the role in a quiet line, a short bio, fact chips, the
 * portrait on the right over giant watermark letters, and a strip of their work. Both founders are
 * on the page, one after the other, in the brand's navy palette.
 */
function FounderPage({ f, index }: { f: (typeof FOUNDERS)[number]; index: number }) {
  const text = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const els = text.current!.querySelectorAll('[data-slide]')
    const st = ScrollTrigger.create({
      trigger: text.current, start: 'top 80%', once: true,
      onEnter: () => gsap.fromTo(els, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.8, stagger: 0.07, ease: 'power3.out' }),
    })
    gsap.set(els, { autoAlpha: 0 })
    return () => st.kill()
  }, [])
  return (
    <article className="relative overflow-hidden" aria-labelledby={`founder-${f.id}`} style={{ background: index % 2 ? '#0A1B33' : 'color-mix(in srgb, #113B6B 28%, #0A1B33)' }}>
      <div className="relative mx-auto max-w-[1400px] px-6 md:px-12 grid md:grid-cols-[1.05fr_1fr] gap-10 md:gap-6 items-end min-h-[88vh]">
        <div aria-hidden="true" className="absolute left-[16%] top-[14%] md:top-[4%] font-display font-bold select-none pointer-events-none whitespace-nowrap" style={{ fontSize: 'clamp(10rem, 34vw, 34rem)', lineHeight: 0.8, letterSpacing: '-0.05em', color: 'color-mix(in srgb, #4FA5FF 9%, transparent)' }}>{f.first}</div>
        <div ref={text} className="relative z-10 pt-24 md:pt-28 pb-10 md:pb-24">
          <div data-slide className="mono text-sky font-medium text-lg">{f.n}</div>
          <h3 id={`founder-${f.id}`} data-slide className="display text-white mt-6" style={{ fontSize: 'clamp(3rem, 1.5rem + 7vw, 9rem)', lineHeight: 0.95 }}>{f.first}<br />{f.last}</h3>
          <div data-slide className="mt-5 text-ice/85 text-xl md:text-2xl font-body font-normal tracking-[0.01em]">{f.role}</div>
          <div data-slide className="mt-6 w-10 h-px bg-sky" />
          <p data-slide className="mt-6 text-ice/80 text-base md:text-lg leading-relaxed max-w-[46ch]">{f.bio}</p>
          <div data-slide className="mt-6 flex flex-wrap gap-2">
            {f.facts.map((s) => (
              <div key={s.label + s.value} className="flex items-center gap-2 rounded-full border border-sky/35 px-3 py-1.5 text-xs text-white min-h-[36px]">
                <Icon name={s.icon} size={16} className="text-ice" /><span className="font-medium">{s.value}</span><span className="text-ice/60">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 self-end">
          <div className="relative aspect-[4/5] md:aspect-[5/6] max-h-[82vh] mx-auto w-full md:w-[92%] rounded-t-[12px] overflow-hidden">
            <ScanPortrait src={f.portrait} alt={f.alt} active />
          </div>
        </div>
      </div>
      <div className="relative z-10 border-t border-ice/10" style={{ background: 'color-mix(in srgb, #0A1B33 70%, transparent)' }}>
        <div className="mx-auto max-w-[1400px] grid md:grid-cols-[220px_1fr]">
          <div className="hidden md:flex items-center gap-3 px-12 py-8 font-display font-semibold text-xl text-white border-r border-ice/10">{index === 0 ? 'Founder 01' : 'Founder 02'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 px-6 md:px-12 py-6 md:py-8 text-white">
            {f.projects.map((p) => (
              <div key={p.title} className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-full border border-ice/25 flex items-center justify-center shrink-0"><Icon name={p.icon} size={22} className="text-ice" /></span>
                <div><div className="font-display font-semibold text-[15px]">{p.title}</div><div className="text-ice/70 text-sm">{p.place}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

function Founders() {
  return (
    <section className="relative text-white" aria-labelledby="about-title" style={{ background: '#0A1B33' }}>
      <div className="h-[18vh]" style={{ background: 'linear-gradient(to bottom, rgba(10,27,51,0) 0%, #0A1B33 100%)' }} aria-hidden="true" />
      <div className="mx-auto max-w-[1400px] px-6 md:px-12 pt-6 md:pt-10 pb-4">
        <div className="label mb-3">Founders</div>
        <h2 id="about-title" className="display text-white" style={{ fontSize: 'clamp(1.8rem, 1rem + 3vw, 4.2rem)' }}>Built in Addis Ababa.<br />Flown for the world.</h2>
      </div>
      {FOUNDERS.map((f, i) => <FounderPage key={f.id} f={f} index={i} />)}
    </section>
  )
}

export function About() {
  return (
    <section id="about" className="relative" aria-label="About Elyon Aerial Services">
      {/* the first screen stays transparent so the landed drone shows through the footage */}
      <div className="relative h-[100vh] flex items-end px-6 md:px-16 pb-16 md:pb-20">
        <p className="text-navy-900 max-w-[46ch] text-lg md:text-2xl font-display font-semibold">Uniting aerial precision, LiDAR technology and intelligent data to create a smarter world.</p>
      </div>
      <Founders />
      <div className="relative" style={{ background: '#0A1B33' }}>
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 pt-20 md:pt-28">
          <p className="text-white font-display font-semibold text-xl md:text-3xl max-w-[30ch]">Uniting aerial precision, LiDAR technology and intelligent data to create a smarter world.</p>
        </div>
        <div className="h-16 md:h-24" />
        <Contact />
      </div>
      <Footer />
    </section>
  )
}

function Contact() {
  const [state, setState] = useState<'idle' | 'flying' | 'done'>('idle')
  const btn = useRef<HTMLButtonElement>(null)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (state !== 'idle') return
    setState('flying')
    gsap.to(btn.current, { x: window.innerWidth, rotate: 6, duration: 1.1, ease: 'power3.in', onComplete: () => setState('done') })
  }
  return (
    <div id="contact" className="mx-auto max-w-[1200px] px-6 md:px-10 pb-24 md:pb-32">
      <div className="rounded-[36px] md:rounded-[999px] bg-navy-700 px-6 py-10 md:px-[9%] md:py-16 text-white overflow-hidden relative">
        <div className="md:flex md:items-start md:gap-12">
          <div className="md:w-[34%]">
            <div className="label mb-3">Contact</div>
            <h2 className="font-display font-semibold text-2xl md:text-4xl">What do you want to scan?</h2>
            <p className="mt-4 text-ice/80 text-sm leading-relaxed">City, building, corridor or land. Tell us the question your data has to answer and we will plan the flight.</p>
            <div className="mt-6 space-y-2 text-sm text-ice">
              <a className="flex items-center gap-2 hover:text-white" href="mailto:hello@elyonaerial.com"><Icon name="mail" size={16} /> hello@elyonaerial.com</a>
              <a className="flex items-center gap-2 hover:text-white" href="https://elyonaerial.com"><Icon name="globe" size={16} /> elyonaerial.com</a>
              <span className="flex items-start gap-2"><Icon name="pin" size={16} className="mt-0.5" /> <span>Imperial BMA Plaza, Bole<br />Addis Ababa, Ethiopia</span></span>
            </div>
          </div>
          <form className="mt-8 md:mt-0 md:flex-1 grid sm:grid-cols-2 gap-4" onSubmit={submit} aria-live="polite">
            {state === 'done' ? (
              <div className="sm:col-span-2 flex items-center gap-3 text-ice text-lg py-8"><Icon name="drone" size={28} /> Flight plan received.</div>
            ) : (
              <>
                <label className="field"><span>Name</span><input name="name" required autoComplete="name" /></label>
                <label className="field"><span>Organisation</span><input name="org" autoComplete="organization" /></label>
                <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
                <label className="field"><span>What do you want to scan?</span>
                  <select name="target" defaultValue="City"><option>City</option><option>Building</option><option>Corridor</option><option>Land</option><option>Other</option></select>
                </label>
                <label className="field sm:col-span-2"><span>Message</span><textarea name="message" rows={3} /></label>
                <div className="sm:col-span-2 flex justify-end">
                  <button ref={btn} type="submit" className="pill solid magnet" disabled={state !== 'idle'}>
                    {state === 'flying' ? <Icon name="drone" size={18} draw={false} /> : 'Request a demo'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="relative bg-navy-900 text-white overflow-hidden">
      <FooterCloud />
      <div className="relative mx-auto max-w-[1200px] px-6 md:px-10 py-16 md:py-20">
        <div className="md:flex md:items-start md:justify-between gap-10">
          <div>
            <Logo variant="lockup" height={96} />
            <p className="mt-4 text-ice/70 text-sm max-w-[32ch]">LiDAR Drone Solutions. Data That Builds Tomorrow.</p>
          </div>
          <div className="mt-10 md:mt-0 grid grid-cols-3 gap-6 md:gap-10">
            {[['precision', 'Aerial Precision'], ['aiData', 'Data Intelligence'], ['globe', 'Real World Impact']].map(([i, t]) => (
              <div key={t} className="flex flex-col items-start gap-3"><Icon name={i} size={28} className="text-ice" /><span className="label" style={{ fontSize: 11 }}>{t}</span></div>
            ))}
          </div>
        </div>
        <div className="mt-12 md:mt-16 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-ice/70 border-t border-ice/10 pt-6">
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            {[['Services', 'scan'], ['Platform', 'twin'], ['Industries', 'land'], ['About', 'about'], ['Contact', 'contact']].map(([l, id]) => <a key={l} href={`#${id}`} className="hover:text-white">{l}</a>)}
          </nav>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@elyonaerial.com" className="hover:text-white">hello@elyonaerial.com</a>
            <span>Imperial BMA Plaza, Bole, Addis Ababa</span>
            <span className="flex items-center gap-3" aria-label="Social">
              <a href="https://www.linkedin.com" aria-label="LinkedIn" className="hover:text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM2.5 9h3v12h-3zM9 9h2.9v1.7h.1c.4-.8 1.4-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.8V21h-3v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9z" /></svg></a>
              <a href="https://x.com" aria-label="X" className="hover:text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h3l-7.5 8.6L22 22h-6.8l-5.3-6.9L3.8 22H1l8-9.2L1.5 2h7l4.8 6.3zM16.9 20h1.9L7.2 4H5.2z" /></svg></a>
            </span>
          </div>
        </div>
        <div className="mt-6 text-xs text-ice/40">© {new Date().getFullYear()} Elyon Aerial Services. LiDAR is written LiDAR.</div>
      </div>
    </footer>
  )
}
