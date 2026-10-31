import { useRef } from 'react'
import { useFilmTween } from '@/lib/film'
import { Icon } from '@/icons/Icon'
import { LAND_VIGNETTES } from '@/three/choreo'

const APPS = [
  { icon: 'agriculture', title: 'Agriculture', data: ['Field boundaries 1,284', 'Crop height 1.2 m', 'Drainage lines 42 km'] },
  { icon: 'corridor', title: 'Road and rail corridors', data: ['Expressway alignment 18 km', 'Cut 184,000 m³', 'Fill 171,000 m³'] },
  { icon: 'mining', title: 'Mining and quarries', data: ['Stockpile volume 42,300 m³', 'Bench height 12 m', 'Haul road grade 8 %'] },
  { icon: 'powerline', title: 'Powerline inspection', data: ['Sag 4.2 m', 'Vegetation clearance alert', 'Towers 118'] },
  { icon: 'dam', title: 'Dams and reservoirs', data: ['Capacity curve 0 to 48 Mm³', 'Crest length 420 m', 'Freeboard 2.1 m'] },
  { icon: 'forestry', title: 'Forestry', data: ['Canopy height model', 'Mean height 14.6 m', 'Cover 61 %'] },
  { icon: 'heritage', title: 'Heritage', data: ['Rock-church section scan', '2 mm resolution', 'Facade 1,420 m²'] },
]

/** Scene 8: application vignettes the drone passes over, each with an animated icon and three data points */
export function Land() {
  const root = useRef<HTMLDivElement>(null)
  const cards = useRef<HTMLDivElement[]>([])
  const cattle = useRef<HTMLDivElement>(null)
  useFilmTween((tl) => {
    tl.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 72.6)
    LAND_VIGNETTES.forEach((at, i) => {
      const el = cards.current[i]
      tl.fromTo(el, { autoAlpha: 0, y: 40, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }, at)
      tl.to(el, { autoAlpha: 0, x: -50, skewX: 6, duration: 0.4, ease: 'power2.in' }, at + 1.25)
    })
    tl.fromTo(cattle.current, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(1.6)' }, 73.4)
    tl.to(cattle.current, { autoAlpha: 0, duration: 0.3 }, 75.2)
    tl.to(root.current, { autoAlpha: 0, duration: 0.5 }, 84)
  })
  return (
    <div ref={root} className="fixed inset-0 z-20 pointer-events-none opacity-0" aria-hidden="true">
      {APPS.map((a, i) => (
        <div key={a.title} ref={(el) => { if (el) cards.current[i] = el }} className="absolute inset-x-3 bottom-3 md:inset-auto md:right-14 md:bottom-28 md:w-[330px] card px-4 py-3 opacity-0" style={{ visibility: 'hidden' }}>
          <div className="flex items-center gap-3">
            <Icon name={a.icon} size={28} className="text-ice" />
            <div><div className="label" style={{ fontSize: 10 }}>Application {String(i + 1).padStart(2, '0')}</div><div className="text-white font-display font-semibold">{a.title}</div></div>
          </div>
          <ul className="mt-2 text-sm text-ice/85 mono space-y-0.5">{a.data.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      ))}
      <div ref={cattle} className="absolute left-1/2 top-[58%] -translate-x-1/2 card px-3 py-2 flex items-center gap-2 text-xs text-white opacity-0">
        <Icon name="lidarPoints" size={16} className="text-ice" draw={false} /> moving objects · <span className="text-sky">cattle: 28</span>
      </div>
    </div>
  )
}
