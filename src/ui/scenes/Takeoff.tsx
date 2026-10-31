import { useEffect, useRef } from 'react'
import { useFilm } from '@/lib/store'
import { useFilmTween } from '@/lib/film'
import { Icon } from '@/icons/Icon'
import { Counter } from '@/ui/Counter'
import { clamp } from '@/lib/math'

/** Scene 1: HUD around the edges, altitude readout, RTK fix switching, section label */
export function Takeoff() {
  const root = useRef<HTMLDivElement>(null)
  const rtk = useRef<HTMLSpanElement>(null)
  const sats = useRef<HTMLSpanElement>(null)
  const heading = useRef<HTMLSpanElement>(null)
  const wind = useRef<HTMLSpanElement>(null)
  useFilmTween((tl) => {
    tl.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 3.6)
    tl.fromTo('.hud-corner', { scale: 0.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out' }, 3.8)
    tl.to(root.current, { autoAlpha: 0, duration: 0.6 }, 12.5)
    tl.set(root.current, { display: 'none' }, 13.2)
  })
  useEffect(() => useFilm.subscribe((s) => {
    const p = s.progress * 100
    if (rtk.current) { const fixed = p > 6.5; rtk.current.textContent = fixed ? 'RTK FIXED' : 'RTK FLOAT'; rtk.current.className = fixed ? 'text-ice' : 'text-sky' }
    if (sats.current) sats.current.textContent = String(Math.round(14 + clamp((p - 4) / 6) * 12))
    if (heading.current) heading.current.textContent = `${String(Math.round((300 + (p - 4) * 4) % 360)).padStart(3, '0')}°`
    if (wind.current) wind.current.textContent = `${(2.1 + Math.sin(p * 1.3) * 0.8).toFixed(1)} m/s`
  }), [])
  return (
    <div ref={root} className="fixed inset-0 z-20 pointer-events-none opacity-0" aria-hidden="true">
      <div className="hud-corner absolute left-5 md:left-8 top-24 flex items-center gap-3">
        <Icon name="altitude" size={22} className="text-ice" />
        <div>
          <div className="label" style={{ fontSize: 10.5 }}>Altitude</div>
          <div className="text-white text-xl md:text-2xl"><Counter from={2355} to={2475} start={4.5} end={11} unit="m AMSL" prefix="ALT " /></div>
        </div>
      </div>
      <div className="hud-corner absolute right-10 md:right-14 top-24 text-right">
        <div className="flex items-center justify-end gap-2"><Icon name="satellite" size={18} className="text-ice" /><span className="label" style={{ fontSize: 10.5 }}>GNSS</span></div>
        <div className="mono text-white"><span ref={rtk} className="text-sky">RTK FLOAT</span> · <span ref={sats}>14</span> sats</div>
      </div>
      <div className="hud-corner absolute left-5 md:left-8 bottom-24 md:bottom-28 flex gap-6 mono text-white text-sm">
        <span className="flex items-center gap-2"><Icon name="battery" size={18} className="text-ice" /> 94 %</span>
        <span className="flex items-center gap-2"><Icon name="heading" size={18} className="text-ice" /><span ref={heading}>300°</span></span>
        <span className="flex items-center gap-2"><Icon name="wind" size={18} className="text-ice" /><span ref={wind}>2.1 m/s</span></span>
      </div>
      <div className="hud-corner absolute right-10 md:right-14 bottom-24 md:bottom-28 text-right mono text-ice/70 text-xs">
        <div>9.0105° N · 38.7613° E</div><div>UTM 37N · WGS 84</div>
      </div>
      {/* frame corners */}
      {['top-20 left-4', 'top-20 right-9', 'bottom-20 left-4', 'bottom-20 right-9'].map((c) => (
        <span key={c} className={`hud-corner absolute ${c} w-6 h-6 border-ice/40`} style={{ borderStyle: 'solid', borderWidth: c.includes('top') ? '1px 0 0 1px' : '0 0 1px 1px', transform: c.includes('right') ? 'scaleX(-1)' : undefined }} />
      ))}
    </div>
  )
}
