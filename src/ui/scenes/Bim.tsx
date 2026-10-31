import { useEffect, useRef } from 'react'
import { useFilmTween } from '@/lib/film'
import { Counter } from '@/ui/Counter'
import { useFilm } from '@/lib/store'
import { Icon } from '@/icons/Icon'

const TREE = ['Structure', 'Facade', 'MEP', 'Interiors']

/** Scene 5: a 3D-software viewport panel titled Scan-to-BIM; LOD and layer tree tick with the helix */
export function Bim() {
  const root = useRef<HTMLDivElement>(null)
  const lod = useRef<HTMLSpanElement>(null)
  const level = useRef<HTMLSpanElement>(null)
  const callout = useRef<HTMLDivElement>(null)
  const ticks = useRef<HTMLSpanElement[]>([])
  useFilmTween((tl) => {
    tl.fromTo(root.current, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 41)
    tl.fromTo(callout.current, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }, 52)
    tl.to(root.current, { autoAlpha: 0, x: 40, duration: 0.6, ease: 'power2.in' }, 54.2)
  })
  useEffect(() => useFilm.subscribe((s) => {
    const p = s.progress * 100
    const k = Math.min(1, Math.max(0, (p - 41) / 10))
    if (lod.current) lod.current.textContent = k < 0.35 ? 'LOD 200' : k < 0.7 ? 'LOD 300' : 'LOD 400'
    if (level.current) level.current.textContent = `Level ${Math.round(k * 46).toString().padStart(2, '0')} / 46`
    ticks.current.forEach((el, i) => { if (el) el.textContent = k > (i + 1) / 4.5 ? '✓' : '·' })
  }), [])
  return (
    <div ref={root} className="fixed inset-x-0 bottom-0 md:inset-auto md:right-14 md:top-24 z-20 pointer-events-none opacity-0 md:w-[360px]" aria-hidden="true">
      <div className="card sheet overflow-hidden" style={{ background: 'color-mix(in srgb, #0A1B33 82%, transparent)' }}>
        <div className="flex items-center justify-between px-4 h-10 border-b border-ice/10">
          <span className="label" style={{ fontSize: 10.5 }}>Scan-to-BIM</span>
          <span className="mono text-ice/70 text-xs"><span ref={lod}>LOD 200</span> · <span ref={level}>Level 00 / 46</span></span>
        </div>
        <div className="grid grid-cols-[1fr_1.3fr] gap-0">
          <div className="border-r border-ice/10 px-4 py-3">
            <div className="label mb-2" style={{ fontSize: 9.5 }}>Layers</div>
            {TREE.map((t, i) => <div key={t} className="flex items-center justify-between text-sm text-white py-1.5"><span>{t}</span><span ref={(el) => { if (el) ticks.current[i] = el }} className="text-sky mono">·</span></div>)}
            <div className="mt-3 flex items-center gap-2 text-ice/60 text-[10px]"><Icon name="heading" size={14} draw={false} /> orbit · <Icon name="precision" size={14} draw={false} /> snap</div>
          </div>
          <div className="px-4 py-3">
            <div className="label mb-2" style={{ fontSize: 9.5 }}>Properties</div>
            <dl className="text-sm text-white space-y-1.5">
              <div className="flex justify-between"><dt className="text-ice/70">Height</dt><dd className="mono">209 m</dd></div>
              <div className="flex justify-between"><dt className="text-ice/70">Floors</dt><dd className="mono">46</dd></div>
              <div className="flex justify-between"><dt className="text-ice/70">Facade panels</dt><dd className="mono"><Counter to={11_240} start={42} end={50} /></dd></div>
              <div className="flex justify-between"><dt className="text-ice/70">Deviation</dt><dd className="mono">max 18 mm</dd></div>
            </dl>
          </div>
        </div>
      </div>
      <div ref={callout} className="absolute left-6 md:-left-64 bottom-[110%] md:bottom-auto md:top-16 card px-3 py-2 text-xs text-white opacity-0 flex items-center gap-2">
        <Icon name="precision" size={16} className="text-sky" draw={false} /> Column C-14, level 31: <span className="text-sky">12 mm offset</span>
      </div>
    </div>
  )
}
