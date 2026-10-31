import { useEffect, useRef, useState } from 'react'
import { useFilmTween } from '@/lib/film'
import { Icon } from '@/icons/Icon'
import { useFilm } from '@/lib/store'

const TABS = ['Dashboard', 'Projects', 'Analytics', 'Digital Twin']
const DISTRICTS = [['Bole', 2.4], ['Kirkos', 3.1], ['Arada', 3.6], ['Yeka', 1.8], ['Gulele', 1.5], ['Nifas Silk', 1.2]] as const
const HIST = [4, 9, 14, 18, 12, 8, 5, 3, 2, 1, 1]

/**
 * Scene 3 to 4: the digital twin turns out to be Elyon's AI Data Platform. Headline, dashboard UI
 * with animated charts and the viewer's own cursor mirrored on the laptop screen.
 */
export function Platform() {
  const root = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const ui = useRef<HTMLDivElement>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState(0)
  useFilmTween((tl) => {
    tl.fromTo(head.current, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 31.4)
    tl.fromTo(ui.current, { autoAlpha: 0, y: 30, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }, 31.9)
    tl.fromTo('.chart-bar', { scaleY: 0 }, { scaleY: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, 32.2)
    tl.fromTo('.solar-roof', { autoAlpha: 0.15 }, { autoAlpha: 1, duration: 0.2, stagger: 0.08 }, 32.6)
    tl.to(head.current, { autoAlpha: 0, y: -40, duration: 0.5, ease: 'power2.in' }, 35.4)
    tl.to(ui.current, { autoAlpha: 0, scale: 1.06, filter: 'blur(8px)', duration: 0.7, ease: 'power2.in' }, 35.8)
  })
  useEffect(() => useFilm.subscribe((s) => {
    if (!cursor.current || !ui.current) return
    const r = ui.current.getBoundingClientRect()
    const x = ((s.pointer.x + 1) / 2) * r.width, y = ((1 - s.pointer.y) / 2) * r.height
    cursor.current.style.transform = `translate(${Math.min(r.width - 6, Math.max(0, x))}px, ${Math.min(r.height - 6, Math.max(0, y))}px)`
  }), [])
  useEffect(() => { const id = setInterval(() => setTab((t) => (t + 1) % 4), 3200); return () => clearInterval(id) }, [])
  return (
    <div ref={root} className="fixed inset-0 z-20 pointer-events-none" aria-hidden="true">
      <div ref={head} className="absolute left-5 right-5 md:left-16 top-24 md:top-28 opacity-0" style={{ visibility: 'hidden' }}>
        <h2 className="display" style={{ fontSize: 'clamp(2rem, 1rem + 3.5vw, 5rem)', fontWeight: 700 }}>One Platform.<br />Endless Possibilities.</h2>
        <p className="mt-3 text-ice/80 text-base md:text-lg" style={{ fontWeight: 500 }}>Beyond Perspective. Into Intelligence.</p>
      </div>
      {/* dashboard projected over the lid region */}
      <div ref={ui} className="absolute left-1/2 -translate-x-1/2 top-[38%] md:top-[30%] w-[92vw] md:w-[64vw] max-w-[1100px] aspect-[16/9] md:aspect-[1.55] card overflow-hidden opacity-0" style={{ visibility: 'hidden', borderColor: 'color-mix(in srgb, #4FA5FF 45%, transparent)' }}>
        <div className="flex items-center gap-1 px-3 md:px-5 h-10 md:h-12 border-b border-ice/10 text-[11px] md:text-[12px] whitespace-nowrap overflow-hidden">
          <span className="label mr-4" style={{ fontSize: 10 }}>AI Data Platform</span>
          {TABS.map((t, i) => <span key={t} className={`px-2.5 py-1 rounded-full ${tab === i ? 'bg-elyon text-white' : 'text-ice/70'}`}>{t}</span>)}
          <span className="ml-auto mono text-ice/60 hidden md:inline">Addis Ababa · 527 km² · 2.4 B pts</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 p-3 md:p-5 h-[calc(100%-3rem)]">
          <div className="card !bg-navy-900/50 p-3 flex flex-col">
            <div className="label" style={{ fontSize: 9.5 }}>Floor-area ratio by district</div>
            <div className="flex-1 flex items-end gap-1.5 mt-2">
              {DISTRICTS.map(([n, v]) => <div key={n} className="flex-1 flex flex-col items-center gap-1"><div className="chart-bar w-full rounded-sm bg-sky origin-bottom" style={{ height: `${(v / 3.6) * 100}%`, opacity: 0.9 }} /><span className="text-[8px] text-ice/60 truncate w-full text-center">{n}</span></div>)}
            </div>
          </div>
          <div className="card !bg-navy-900/50 p-3 flex flex-col">
            <div className="label" style={{ fontSize: 9.5 }}>Building-height histogram</div>
            <div className="flex-1 flex items-end gap-[2px] mt-2">
              {HIST.map((v, i) => <div key={i} className="chart-bar flex-1 bg-elyon origin-bottom rounded-t-sm" style={{ height: `${(v / 18) * 100}%` }} />)}
            </div>
            <div className="text-[8px] text-ice/60 mt-1 flex justify-between"><span>3 m</span><span>209 m</span></div>
          </div>
          <div className="card !bg-navy-900/50 p-3 flex flex-col">
            <div className="label" style={{ fontSize: 9.5 }}>Flood-risk heat layer</div>
            <div className="flex-1 grid grid-cols-6 gap-[2px] mt-2">
              {Array.from({ length: 24 }, (_, i) => { const r = Math.abs(Math.sin(i * 1.7)) ; return <div key={i} className="chart-bar rounded-[2px] origin-bottom" style={{ background: r > 0.75 ? '#BDE2FF' : r > 0.45 ? '#4FA5FF' : r > 0.2 ? '#1E63D6' : '#113B6B' }} /> })}
            </div>
          </div>
          <div className="card !bg-navy-900/50 p-3 flex flex-col">
            <div className="label flex items-center gap-1" style={{ fontSize: 9.5 }}><Icon name="solar" size={12} draw={false} /> Solar-potential rooftops</div>
            <div className="flex-1 grid grid-cols-5 gap-1 mt-2">
              {Array.from({ length: 15 }, (_, i) => <div key={i} className="solar-roof rounded-sm border border-sky/40" style={{ background: i % 3 === 0 ? '#4FA5FF' : i % 3 === 1 ? 'color-mix(in srgb, #4FA5FF 40%, transparent)' : 'transparent' }} />)}
            </div>
            <div className="mono text-ice text-xs mt-1">1,842 roofs · 96 MWp</div>
          </div>
        </div>
        {/* the viewer's own cursor on the laptop */}
        <div ref={cursor} className="absolute left-0 top-0 w-3 h-3 pointer-events-none" style={{ willChange: 'transform' }}>
          <svg viewBox="0 0 12 12" width="12" height="12"><path d="M1 1l10 4-4 1-1 4z" fill="#FFFFFF" stroke="#0A1B33" strokeWidth="0.8" /></svg>
        </div>
      </div>
    </div>
  )
}
