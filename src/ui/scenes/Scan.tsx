import { useRef } from 'react'
import { useFilmTween } from '@/lib/film'
import { Counter } from '@/ui/Counter'
import { DataRow, Panel } from '@/ui/primitives'
import { Icon } from '@/icons/Icon'

/** Scene 2: live data panel rising with the scan; pigeon-flock noise tag */
export function Scan() {
  const root = useRef<HTMLDivElement>(null)
  const rows = useRef<HTMLDivElement>(null)
  const noise = useRef<HTMLDivElement>(null)
  useFilmTween((tl) => {
    tl.fromTo(root.current, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 13)
    tl.fromTo(rows.current!.children, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.5, ease: 'power3.out' }, 13.4)
    tl.fromTo(noise.current, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(1.6)' }, 16.6)
    tl.to(noise.current, { autoAlpha: 0, duration: 0.3 }, 18.4)
    tl.to(root.current, { autoAlpha: 0, y: -30, duration: 0.6, ease: 'power2.in' }, 21.6)
  })
  return (
    <div ref={root} className="fixed inset-x-0 bottom-0 md:inset-auto md:right-14 md:top-1/2 md:-translate-y-1/2 z-20 pointer-events-none opacity-0 md:w-[340px]" aria-hidden="true">
      <Panel className="sheet" title="Live scan">
        <div ref={rows}>
          <DataRow icon="points" label="Points captured"><Counter to={2_418_000_000} start={13} end={21.4} linear /></DataRow>
          <DataRow icon="density" label="Point density">400 pts/m²</DataRow>
          <DataRow icon="accuracy" label="Vertical accuracy">±3 cm</DataRow>
          <DataRow icon="swath" label="Swath width">320 m</DataRow>
          <DataRow icon="area" label="Area covered"><Counter to={527} start={13} end={21.4} unit="km²" linear /></DataRow>
          <DataRow icon="pulses" label="Return pulses">5 per shot</DataRow>
        </div>
      </Panel>
      <div ref={noise} className="absolute left-6 md:-left-56 top-10 card px-3 py-2 flex items-center gap-2 text-xs text-white opacity-0">
        <Icon name="lidarPoints" size={18} className="text-ice" /> flock · 60 pts · <span className="text-sky">noise: removed</span>
      </div>
    </div>
  )
}
