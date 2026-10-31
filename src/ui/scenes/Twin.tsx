import { useRef } from 'react'
import { useFilmTween } from '@/lib/film'
import { DataRow, Panel } from '@/ui/primitives'
import { Counter } from '@/ui/Counter'

const LAYERS = [
  { icon: 'buildings', label: 'Buildings', value: <><Counter to={178_000} start={28.7} end={29.9} /> footprints</> },
  { icon: 'roads', label: 'Roads', value: <><Counter to={4_900} start={29.1} end={30.3} unit="km" /></> },
  { icon: 'vegetation', label: 'Vegetation', value: <>canopy <Counter to={12} start={29.5} end={30.6} unit="%" /></> },
  { icon: 'power', label: 'Power lines', value: <><Counter to={1_240} start={30} end={31} unit="km" /></> },
  { icon: 'water', label: 'Water bodies', value: <><Counter to={38} start={30.4} end={31.4} /> mapped</> },
  { icon: 'contours', label: 'Terrain', value: 'contours at 1 m' },
]

/** Scene 3: classified layers peel on one by one during the orbit */
export function Twin() {
  const root = useRef<HTMLDivElement>(null)
  const rows = useRef<HTMLDivElement>(null)
  useFilmTween((tl) => {
    tl.fromTo(root.current, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out' }, 28.4)
    tl.fromTo(rows.current!.children, { autoAlpha: 0, x: -40, scale: 0.96 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.5, stagger: 0.45, ease: 'power3.out' }, 28.7)
    tl.to(root.current, { autoAlpha: 0, x: -30, duration: 0.5, ease: 'power2.in' }, 32)
  })
  return (
    <div ref={root} className="fixed inset-x-0 bottom-0 md:inset-auto md:left-8 md:top-1/2 md:-translate-y-1/2 z-20 pointer-events-none opacity-0 md:w-[320px]" aria-hidden="true">
      <Panel className="sheet" title="Classified layers">
        <div ref={rows}>{LAYERS.map((l) => <DataRow key={l.label} icon={l.icon} label={l.label}>{l.value}</DataRow>)}</div>
      </Panel>
    </div>
  )
}
