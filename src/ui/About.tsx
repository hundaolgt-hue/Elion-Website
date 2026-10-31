import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/film'
import { Icon } from '@/icons/Icon'
import { Logo } from '@/brand/Logo'
import { FOUNDERS } from '@/data/founders'
import { generateCity } from '@/world/city'

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
 * Founders, in the editorial hero grammar of the reference, on the light palette: each founder is a
 * full page with a numbered index, a very large display name, the role in a quiet line, a short bio,
 * fact chips, the supplied portrait on the right over giant watermark letters, and a dark strip of
 * their work. Both founders are on the page, Dagim first, then Hundaol.
 */
const LIGHT_BG = '#F0EFEB' // the paper tone of the supplied portraits, so the crops sit seamlessly

function Portrait({ src, alt }: { src: string; alt: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const line = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = img.current!, ln = line.current!
    gsap.set(el, { clipPath: 'inset(0 0 100% 0)' })
    const st = ScrollTrigger.create({
      trigger: wrap.current, start: 'top 98%', once: true,
      onEnter: () => {
        gsap.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.6, ease: 'power2.inOut' })
        gsap.fromTo(ln, { top: '0%', opacity: 1 }, { top: '100%', duration: 1.6, ease: 'power2.inOut', onComplete: () => gsap.to(ln, { opacity: 0, duration: 0.3 }) })
      },
    })
    return () => st.kill()
  }, [])
  return (
    <div ref={wrap} className="relative w-full">
      <img ref={img} src={src} alt={alt} className="block w-full h-auto select-none" loading="lazy" decoding="async" draggable={false} />
      <div ref={line} className="absolute left-0 right-0 h-px bg-sky pointer-events-none" style={{ top: 0, boxShadow: '0 0 18px 2px rgba(79,165,255,0.6)' }} aria-hidden="true" />
    </div>
  )
}

function FounderPage({ f }: { f: (typeof FOUNDERS)[number] }) {
  const text = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const els = text.current!.querySelectorAll('[data-slide]')
    gsap.set(els, { autoAlpha: 0 })
    const st = ScrollTrigger.create({
      trigger: text.current, start: 'top 78%', once: true,
      onEnter: () => gsap.fromTo(els, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.8, stagger: 0.07, ease: 'power3.out' }),
    })
    return () => st.kill()
  }, [])
  return (
    <article className="relative overflow-hidden" aria-labelledby={`founder-${f.id}`} style={{ background: LIGHT_BG }}>
      <div className="relative mx-auto max-w-[1500px] px-6 md:px-12 grid md:grid-cols-[1fr_1.1fr] gap-6 md:gap-0 items-end min-h-[92vh]">
        <div aria-hidden="true" className="absolute left-[14%] top-[12%] md:top-[6%] font-display font-bold select-none pointer-events-none whitespace-nowrap" style={{ fontSize: 'clamp(10rem, 34vw, 34rem)', lineHeight: 0.8, letterSpacing: '-0.05em', color: 'color-mix(in srgb, #113B6B 7%, transparent)' }}>{f.first}</div>
        <div ref={text} className="relative z-10 pt-24 md:pt-28 pb-12 md:pb-24 md:pr-8">
          <div data-slide className="mono text-navy-900 font-medium text-lg">{f.n}</div>
          <h3 id={`founder-${f.id}`} data-slide className="display text-navy-900 mt-6" style={{ fontSize: 'clamp(3rem, 1.4rem + 6.2vw, 8rem)', lineHeight: 0.95 }}>{f.first}<br />{f.last}</h3>
          <div data-slide className="mt-5 text-navy-700 text-xl md:text-2xl font-body font-normal tracking-[0.01em]">{f.role}</div>
          <div data-slide className="mt-6 w-10 h-px bg-navy-900" />
          <p data-slide className="mt-6 text-navy-700 text-base md:text-lg leading-relaxed max-w-[44ch]">{f.bio}</p>
          <div data-slide className="mt-6 flex flex-wrap gap-2">
            {f.facts.map((s) => (
              <div key={s.label + s.value} className="flex items-center gap-2 rounded-full border border-elyon/30 bg-white/60 px-3 py-1.5 text-xs text-navy-900 min-h-[36px]">
                <Icon name={s.icon} size={16} className="text-elyon" /><span className="font-medium">{s.value}</span><span className="text-navy-700/70">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 self-end md:-mr-12">
          <Portrait src={f.portrait} alt={f.alt} />
        </div>
      </div>
      {f.projects.length > 0 && (
        <div className="relative z-10 bg-navy-900 text-white">
          <div className="mx-auto max-w-[1500px] grid md:grid-cols-[220px_1fr]">
            <div className="hidden md:flex items-center gap-3 px-12 py-8 font-display font-semibold text-xl border-r border-ice/10">Founder {f.n}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 px-6 md:px-12 py-6 md:py-8">
              {f.projects.map((p) => (
                <div key={p.title} className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full border border-ice/25 flex items-center justify-center shrink-0"><Icon name={p.icon} size={22} className="text-ice" /></span>
                  <div><div className="font-display font-semibold text-[15px]">{p.title}</div><div className="text-ice/70 text-sm">{p.place}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {f.projects.length === 0 && <div className="relative z-10 h-px bg-navy-900/10" aria-hidden="true" />}
    </article>
  )
}

function Founders() {
  return (
    <section className="relative light" aria-labelledby="about-title" style={{ background: LIGHT_BG }}>
      <div className="mx-auto max-w-[1500px] px-6 md:px-12 pt-16 md:pt-24 pb-4">
        <div className="label mb-3">Founders</div>
        <h2 id="about-title" className="display text-navy-900" style={{ fontSize: 'clamp(1.8rem, 1rem + 3vw, 4.2rem)' }}>Built in Addis Ababa.<br />Flown for the world.</h2>
      </div>
      {FOUNDERS.map((f) => <FounderPage key={f.id} f={f} />)}
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
      <div className="relative light" style={{ background: '#F0EFEB' }}>
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 pt-20 md:pt-28">
          <p className="text-navy-900 font-display font-semibold text-xl md:text-3xl max-w-[30ch]">Uniting aerial precision, LiDAR technology and intelligent data to create a smarter world.</p>
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
