import { useEffect, useRef } from 'react'
import { useFilm } from '@/lib/store'

/** Sky ring with a centre dot; crosshair over scannable objects, "+" over interactive cards. Magnetic buttons. */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    document.body.classList.add('has-custom-cursor')
    let x = window.innerWidth / 2, y = window.innerHeight / 2, rx = x, ry = y
    let raf = 0
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY
      const t = e.target as HTMLElement
      const interactive = t.closest('a, button, [role=button], input, select, textarea, .card.interactive, .parcel, .sensor')
      const state = useFilm.getState()
      const kind = state.hovered.kind
      ring.current!.dataset.mode = interactive ? 'plus' : kind === 'building' || kind === 'drone' || state.playground ? 'cross' : 'ring'
      // magnetic pull
      const mag = t.closest<HTMLElement>('.pill')
      document.querySelectorAll<HTMLElement>('.pill.magnet').forEach((b) => { if (b !== mag) b.style.transform = '' })
      if (mag) {
        const r = mag.getBoundingClientRect()
        const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2)
        if (Math.hypot(dx, dy) < 40 + r.width / 2) { mag.classList.add('magnet'); mag.style.transform = `translate(${dx * 0.18}px, ${dy * 0.25}px)` }
      }
    }
    const tick = () => {
      rx += (x - rx) * 0.22; ry += (y - ry) * 0.22
      ring.current!.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`
      dot.current!.style.transform = `translate(${x - 2}px, ${y - 2}px)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); document.body.classList.remove('has-custom-cursor') }
  }, [])
  return (
    <>
      <div ref={ring} className="cursor-ring" data-mode="ring" aria-hidden="true"><span /><span /></div>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
