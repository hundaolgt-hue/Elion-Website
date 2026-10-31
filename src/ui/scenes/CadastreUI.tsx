import { useEffect, useRef, useState } from 'react'
import { useFilmTween } from '@/lib/film'
import { DataRow, Panel } from '@/ui/primitives'
import { Counter } from '@/ui/Counter'
import { useFilm } from '@/lib/store'
import { Icon } from '@/icons/Icon'

/** Scene 7: cadastre counters and the VERIFIED stamp that lands at the viewer's cursor */
export function CadastreUI() {
  const root = useRef<HTMLDivElement>(null)
  const [stamp, setStamp] = useState<{ x: number; y: number; key: number } | null>(null)
  const armed = useRef(false)
  useFilmTween((tl) => {
    tl.fromTo(root.current, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 64)
    tl.to(root.current, { autoAlpha: 0, x: -30, duration: 0.6, ease: 'power2.in' }, 71.6)
  })
  useEffect(() => useFilm.subscribe((s) => {
    const p = s.progress * 100
    if (p > 69.2 && p < 71.5 && !armed.current) {
      armed.current = true
      const x = ((s.pointer.x + 1) / 2) * window.innerWidth, y = ((1 - s.pointer.y) / 2) * window.innerHeight
      setStamp({ x: x || window.innerWidth * 0.6, y: y || window.innerHeight * 0.5, key: Date.now() })
    }
    if (p < 68.5 || p > 72) { if (armed.current) setStamp(null); armed.current = false }
  }), [])
  return (
    <div ref={root} className="fixed inset-0 z-20 pointer-events-none opacity-0" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 md:inset-auto md:left-8 md:top-1/2 md:-translate-y-1/2 md:w-[320px]">
        <Panel className="sheet" title="District cadastre">
          <DataRow icon="cadastre" label="Parcels mapped"><Counter to={93_400} start={64.5} end={69} /></DataRow>
          <DataRow icon="buildings" label="3D property units"><Counter to={1.2} start={66.5} end={70} decimals={1} unit="M" /></DataRow>
          <DataRow icon="accuracy" label="Boundary accuracy">±5 cm</DataRow>
        </Panel>
      </div>
      {stamp && (
        <div key={stamp.key} className="stamp absolute flex items-center gap-2 px-4 py-2 rounded-md border-2 border-sky text-sky font-display font-bold tracking-[0.2em] text-sm bg-navy-900/60" style={{ left: stamp.x - 70, top: stamp.y - 20, opacity: 0 }}>
          <Icon name="verified" size={18} draw={false} /> VERIFIED
        </div>
      )}
    </div>
  )
}
