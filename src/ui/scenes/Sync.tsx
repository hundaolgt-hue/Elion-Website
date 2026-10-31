import { useEffect, useRef, useState } from 'react'
import { useFilmTween } from '@/lib/film'
import { useFilm } from '@/lib/store'
import { Icon } from '@/icons/Icon'

/**
 * Scene 6: physical and digital in sync. Scroll-driven floor events (floor 20 lights off, lift
 * moves, fire sensor test) and the bidirectional hover toggle. The other world follows within 120 ms.
 */
export function Sync() {
  const root = useRef<HTMLDivElement>(null)
  const alert = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<string[]>([])
  const [energy, setEnergy] = useState(418)
  const fired = useRef<Record<string, boolean>>({})
  useFilmTween((tl) => {
    tl.fromTo(root.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 55.4)
    tl.fromTo(alert.current, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power3.out' }, 59.2)
    tl.to(root.current, { autoAlpha: 0, y: -30, duration: 0.6, ease: 'power2.in' }, 61.6)
  })
  useEffect(() => {
    const onFloor = (e: Event) => {
      const { index, on, source } = (e as CustomEvent).detail as { index: number; on: boolean; source: string }
      setLog((l) => [`${source === 'twin' ? 'Twin' : 'Building'} · L${index + 1} ${on ? 'on' : 'off'} → ${source === 'twin' ? 'building' : 'twin'} follows 120 ms`, ...l].slice(0, 4))
      setEnergy((v) => Math.max(200, v + (on ? 9 : -9)))
    }
    window.addEventListener('elyon:floor', onFloor)
    const unsub = useFilm.subscribe((s) => {
      const p = s.progress * 100
      const trigger = (key: string, when: boolean, fn: () => void) => { if (when && !fired.current[key]) { fired.current[key] = true; fn() } if (!when && fired.current[key] && p < 56) fired.current[key] = false }
      trigger('f20', p > 56.8, () => { if (s.floors[19]) setTimeout(() => useFilm.getState().toggleFloor(19, 'physical'), 120) })
      trigger('lift', p > 58, () => setLog((l) => ['Lift car 2 · L12 → L20 · twin follows 120 ms', ...l].slice(0, 4)))
      trigger('fire', p > 59.2, () => setLog((l) => ['Smoke detector L8-04: test mode', ...l].slice(0, 4)))
    })
    return () => { window.removeEventListener('elyon:floor', onFloor); unsub() }
  }, [])
  return (
    <div ref={root} className="fixed inset-0 z-20 pointer-events-none opacity-0" aria-hidden="true">
      <div className="absolute left-5 md:left-16 top-24 md:top-28 max-w-[22ch] hidden md:block">
        <h2 className="display" style={{ fontSize: 'clamp(1.8rem, 1rem + 3vw, 4.2rem)' }}>Every sensor.<br />Both worlds.<br />One truth.</h2>
        <div className="mt-4 flex gap-4 text-xs mono text-ice/80"><span>PHYSICAL</span><span className="text-sky">⟷ 120 ms</span><span>DIGITAL</span></div>
      </div>
      <div className="absolute inset-x-3 bottom-3 md:inset-auto md:right-14 md:bottom-28 md:w-[320px] card px-4 py-3 text-xs text-white">
        <div className="flex items-center justify-between"><span className="label" style={{ fontSize: 10 }}>Energy gauge</span><span className="mono text-ice">{energy} kW</span></div>
        <div className="h-1.5 rounded-full bg-navy-900 mt-2 overflow-hidden"><div className="h-full bg-sky transition-all duration-500" style={{ width: `${((energy - 200) / 300) * 100}%` }} /></div>
        <div className="mt-3 space-y-1 min-h-[4.5rem]">{log.map((l, i) => <div key={i} className={i === 0 ? 'text-white' : 'text-ice/60'}>{l}</div>)}{log.length === 0 && <div className="text-ice/50">Hover a floor on the twin to toggle its lights.</div>}</div>
      </div>
      <div ref={alert} className="absolute right-4 md:right-14 top-24 card px-3 py-2 flex items-center gap-2 text-xs text-white opacity-0 border-sky/50">
        <Icon name="fire" size={18} className="text-sky" /> Smoke detector L8-04: <span className="text-sky">test mode</span>
      </div>
    </div>
  )
}
